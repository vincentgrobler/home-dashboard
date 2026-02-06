import { useState, useEffect } from 'react';

interface Event {
  time: string;
  title: string;
  type: 'calendar' | 'meal';
}

interface MealsBySlot {
  [slot: string]: string[];
}

const CALENDAR_URL = 'https://calendar.google.com/calendar/ical/family11116426684739662442%40group.calendar.google.com/private-5a3d661447bc3df11465434fa3a1cb46/basic.ics';

// V.I.K.I. Supabase config
const VIKI_SUPABASE_URL = 'https://khlkijcbfgljjpgxqxxm.supabase.co';
const VIKI_ANON_KEY = import.meta.env.VITE_VIKI_ANON_KEY || '';
const VIKI_EMAIL = import.meta.env.VITE_VIKI_EMAIL || '';
const VIKI_PASSWORD = import.meta.env.VITE_VIKI_PASSWORD || '';

// CORS proxies
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

export default function EventsCard() {
  const [todayEvents, setTodayEvents] = useState<Event[]>([]);
  const [tomorrowEvents, setTomorrowEvents] = useState<Event[]>([]);
  const [todayMeals, setTodayMeals] = useState<MealsBySlot>({});
  const [tomorrowMeals, setTomorrowMeals] = useState<MealsBySlot>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const calendarEvents: { date: Date; event: Event }[] = [];
      const todayMealsBySlot: MealsBySlot = {};
      const tomorrowMealsBySlot: MealsBySlot = {};

      // Fetch calendar events
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
                calendarEvents.push({ date: today, event: { time: timeStr, title: summary, type: 'calendar' } });
              }
              if (startDay <= tomorrow && endDay >= tomorrow) {
                calendarEvents.push({ date: tomorrow, event: { time: timeStr, title: summary, type: 'calendar' } });
              }
            }
          });
        }
      } catch (e) { console.error('Calendar fetch failed:', e); }

      // Authenticate and fetch V.I.K.I. meals
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
                if (!todayMealsBySlot[slot]) todayMealsBySlot[slot] = [];
                todayMealsBySlot[slot].push(mealName);
              } else if (mealDateStr === tomorrowStr) {
                if (!tomorrowMealsBySlot[slot]) tomorrowMealsBySlot[slot] = [];
                tomorrowMealsBySlot[slot].push(mealName);
              }
            });
          }
        } catch (e) { console.error('V.I.K.I. fetch failed:', e); }
      }

      // Sort calendar events
      const sortEvents = (events: Event[]) => events.sort((a, b) => {
        if (a.time === 'All day') return -1;
        if (b.time === 'All day') return 1;
        return a.time.localeCompare(b.time);
      });
      
      setTodayEvents(sortEvents(calendarEvents.filter(e => e.date.getTime() === today.getTime()).map(e => e.event)));
      setTomorrowEvents(sortEvents(calendarEvents.filter(e => e.date.getTime() === tomorrow.getTime()).map(e => e.event)));
      setTodayMeals(todayMealsBySlot);
      setTomorrowMeals(tomorrowMealsBySlot);
      setLoading(false);
    };

    fetchData();
    const interval = setInterval(fetchData, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const renderMeals = (mealsBySlot: MealsBySlot) => {
    const slots = Object.keys(mealsBySlot);
    if (slots.length === 0) return null;
    
    return (
      <div className="meals-section">
        {slots.map(slot => (
          <div key={slot} className="meal-slot">
            <div className="meal-slot-header">
              <span className="meal-icon">🍽️</span>
              <span className="meal-slot-name">{slot}</span>
            </div>
            <div className="meal-dishes">
              {mealsBySlot[slot].map((dish, idx) => (
                <span key={idx} className="meal-chip">{dish}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderEvents = (events: Event[], emptyMsg: string) => (
    <div className="events-list">
      {events.length === 0 ? (
        <div className="events-empty">{emptyMsg}</div>
      ) : (
        events.map((event, idx) => (
          <div key={idx} className="event-item">
            <div className="event-time">{event.time}</div>
            <div className="event-title">{event.title}</div>
          </div>
        ))
      )}
    </div>
  );

  return (
    <div className="events-container">
      <div className="card card-dark events-card">
        <h2 className="events-title">What is happening today</h2>
        {loading ? (
          <div className="events-empty">Loading...</div>
        ) : (
          <>
            {renderEvents(todayEvents, 'No events')}
            {renderMeals(todayMeals)}
            {todayEvents.length === 0 && Object.keys(todayMeals).length === 0 && (
              <div className="events-empty">Nothing planned</div>
            )}
          </>
        )}
      </div>
      <div className="card card-dark events-card">
        <h2 className="events-title">What is happening tomorrow</h2>
        {loading ? (
          <div className="events-empty">Loading...</div>
        ) : (
          <>
            {renderEvents(tomorrowEvents, 'No events')}
            {renderMeals(tomorrowMeals)}
            {tomorrowEvents.length === 0 && Object.keys(tomorrowMeals).length === 0 && (
              <div className="events-empty">Nothing planned</div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
