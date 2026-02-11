import type { DashboardEvent, MealsBySlot, EnergyData, PurifierData } from '../types';

// Calendar Config
const CALENDAR_URL = 'https://calendar.google.com/calendar/ical/family11116426684739662442%40group.calendar.google.com/private-5a3d661447bc3df11465434fa3a1cb46/basic.ics';

// V.I.K.I. Config
const VIKI_SUPABASE_URL = 'https://khlkijcbfgljjpgxqxxm.supabase.co';
const VIKI_ANON_KEY = import.meta.env.VITE_VIKI_ANON_KEY || '';
const VIKI_EMAIL = import.meta.env.VITE_VIKI_EMAIL || '';
const VIKI_PASSWORD = import.meta.env.VITE_VIKI_PASSWORD || '';

// Octopus Config
const OCT_API_KEY = import.meta.env.VITE_OCTOPUS_API_KEY || '';
const OCT_MPAN = import.meta.env.VITE_OCTOPUS_MPAN || '';
const OCT_ELEC_SERIAL = import.meta.env.VITE_OCTOPUS_ELEC_SERIAL || '';
const OCT_MPRN = import.meta.env.VITE_OCTOPUS_MPRN || '';
const OCT_GAS_SERIAL = import.meta.env.VITE_OCTOPUS_GAS_SERIAL || '';

// Dashboard API
const DASHBOARD_API_URL = import.meta.env.VITE_DASHBOARD_API_URL || '';

// Rates
const ELEC_RATE = 0.2450;
const GAS_RATE = 0.0614;
const GAS_CONVERSION = 11.1868; // m³ to kWh

const CORS_PROXIES = [
  (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
];

async function fetchWithCorsProxy(url: string): Promise<string | null> {
  for (const proxyFn of CORS_PROXIES) {
    try {
      const proxyUrl = proxyFn(url);
      const res = await fetch(proxyUrl, { headers: { 'X-Requested-With': 'XMLHttpRequest' } });
      if (res.ok) {
        const text = await res.text();
        if (text.includes('BEGIN:VCALENDAR')) return text;
      }
    } catch { /* try next */ }
  }
  return null;
}

async function authenticateViki(): Promise<string | null> {
  if (!VIKI_ANON_KEY || !VIKI_EMAIL || !VIKI_PASSWORD) return null;
  
  try {
    const res = await fetch(`${VIKI_SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { 'apikey': VIKI_ANON_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: VIKI_EMAIL, password: VIKI_PASSWORD })
    });
    if (res.ok) {
      const data = await res.json();
      return data.access_token;
    }
  } catch (e) { console.error('V.I.K.I. auth failed:', e); }
  return null;
}

export const fetchCalendarData = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayEvents: DashboardEvent[] = [];
  const tomorrowEvents: DashboardEvent[] = [];

  try {
    const icsData = await fetchWithCorsProxy(CALENDAR_URL);
    if (icsData) {
      const eventRegex = /BEGIN:VEVENT[\s\S]*?END:VEVENT/g;
      const matches = icsData.match(eventRegex) || [];
      
      matches.forEach(block => {
        const summaryMatch = block.match(/SUMMARY:(.+)/);
        const dtstartMatch = block.match(/DTSTART[^:]*:(\d{8}T?\d{0,6})/);
        const dtendMatch = block.match(/DTEND[^:]*:(\d{8}T?\d{0,6})/);
        
        if (summaryMatch && dtstartMatch) {
          const summary = summaryMatch[1].trim().replace(/\\,/g, ',').replace(/\\n/g, ' ');
          const dtstart = dtstartMatch[1];
          const dtend = dtendMatch ? dtendMatch[1] : dtstart;
          
          let startDate: Date, isAllDay = false;
          if (dtstart.length === 8) {
            isAllDay = true;
            startDate = new Date(parseInt(dtstart.slice(0,4)), parseInt(dtstart.slice(4,6)) - 1, parseInt(dtstart.slice(6,8)));
          } else {
            startDate = new Date(parseInt(dtstart.slice(0,4)), parseInt(dtstart.slice(4,6)) - 1, parseInt(dtstart.slice(6,8)), parseInt(dtstart.slice(9,11) || '0'), parseInt(dtstart.slice(11,13) || '0'));
          }
          
          let endDate: Date;
          if (dtend.length === 8) {
            endDate = new Date(parseInt(dtend.slice(0,4)), parseInt(dtend.slice(4,6)) - 1, parseInt(dtend.slice(6,8)));
          } else {
            endDate = new Date(parseInt(dtend.slice(0,4)), parseInt(dtend.slice(4,6)) - 1, parseInt(dtend.slice(6,8)), parseInt(dtend.slice(9,11) || '0'), parseInt(dtend.slice(11,13) || '0'));
          }
          
          const startDay = new Date(startDate); startDay.setHours(0, 0, 0, 0);
          const endDay = new Date(endDate); endDay.setHours(0, 0, 0, 0);
          const timeStr = isAllDay ? 'All day' : `${startDate.getHours().toString().padStart(2, '0')}:${startDate.getMinutes().toString().padStart(2, '0')}`;
          
          if (startDay <= today && endDay >= today) {
            todayEvents.push({ time: timeStr, title: summary, type: 'calendar' });
          }
          if (startDay <= tomorrow && endDay >= tomorrow) {
            tomorrowEvents.push({ time: timeStr, title: summary, type: 'calendar' });
          }
        }
      });
    }
  } catch (e) { console.error('Calendar fetch failed:', e); }

  const sortEvents = (events: DashboardEvent[]) => events.sort((a, b) => {
    if (a.time === 'All day') return -1;
    if (b.time === 'All day') return 1;
    return a.time.localeCompare(b.time);
  });

  return { today: sortEvents(todayEvents), tomorrow: sortEvents(tomorrowEvents) };
};

export const fetchVikiData = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayMeals: MealsBySlot = {};
  const tomorrowMeals: MealsBySlot = {};

  const accessToken = await authenticateViki();
  if (accessToken) {
    try {
      const todayStr = today.toISOString().split('T')[0];
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      
      const plannedRes = await fetch(
        `${VIKI_SUPABASE_URL}/rest/v1/planned_meals?select=*,meals(name)&date=gte.${todayStr}&date=lte.${tomorrowStr}`,
        { headers: { 'apikey': VIKI_ANON_KEY, 'Authorization': `Bearer ${accessToken}` } }
      );
      
      if (plannedRes.ok) {
        const planned = await plannedRes.json();
        planned.forEach((pm: any) => {
          const mealDateStr = pm.date;
          const slot = (pm.slot || 'dinner').charAt(0).toUpperCase() + (pm.slot || 'dinner').slice(1);
          const mealName = pm.meals?.name || 'Planned meal';
          
          if (mealDateStr === todayStr) {
            if (!todayMeals[slot]) todayMeals[slot] = [];
            todayMeals[slot].push(mealName);
          } else if (mealDateStr === tomorrowStr) {
            if (!tomorrowMeals[slot]) tomorrowMeals[slot] = [];
            tomorrowMeals[slot].push(mealName);
          }
        });
      }
    } catch (e) { console.error('V.I.K.I. fetch failed:', e); }
  }
  
  return { today: todayMeals, tomorrow: tomorrowMeals };
};

export const fetchEnergyData = async (type: 'electricity' | 'gas', period: 'day' | 'week' | 'month'): Promise<EnergyData> => {
  if (!OCT_API_KEY) throw new Error('No API Key');

  const periods = period === 'day' ? 48 : period === 'week' ? 336 : 1440;
  const endpoint = type === 'electricity'
    ? `https://api.octopus.energy/v1/electricity-meter-points/${OCT_MPAN}/meters/${OCT_ELEC_SERIAL}/consumption/?page_size=${periods}`
    : `https://api.octopus.energy/v1/gas-meter-points/${OCT_MPRN}/meters/${OCT_GAS_SERIAL}/consumption/?page_size=${periods}`;

  const res = await fetch(endpoint, {
    headers: {
      'Authorization': 'Basic ' + btoa(OCT_API_KEY + ':')
    }
  });
  
  const json = await res.json();
  
  if (json.results && json.results.length > 0) {
    let total = json.results.reduce((sum: number, r: any) => sum + r.consumption, 0);
    
    // Convert gas m³ to kWh
    if (type === 'gas') {
      total = total * GAS_CONVERSION;
    }
    
    // Calculate cost
    const rate = type === 'electricity' ? ELEC_RATE : GAS_RATE;
    const cost = total * rate;
    
    // Get chart data (10 points, smoothed)
    const chartData: number[] = [];
    const chunkSize = Math.max(1, Math.floor(json.results.length / 10));
    for (let i = 0; i < 10; i++) {
      const chunk = json.results.slice(i * chunkSize, (i + 1) * chunkSize);
      let chunkTotal = chunk.reduce((sum: number, r: any) => sum + r.consumption, 0);
      if (type === 'gas') chunkTotal *= GAS_CONVERSION;
      chartData.push(chunkTotal);
    }
    
    return {
      value: Math.round(total),
      cost: Math.round(cost * 100) / 100,
      unit: 'kWh',
      chartData: chartData.reverse()
    };
  } else {
    return {
      value: 0,
      cost: 0,
      unit: 'kWh',
      chartData: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    };
  }
};

export const fetchPurifierData = async (): Promise<PurifierData> => {
  try {
    const res = await fetch(`${DASHBOARD_API_URL}/api/purifier`);
    const json = await res.json();
    if (json.error) throw new Error(json.error);
    return json;
  } catch (e) {
    throw new Error('Cannot connect to API');
  }
};
