import { useState, useEffect } from 'react';

interface Event {
  time: string;
  title: string;
  type: 'calendar' | 'meal';
}

const CALENDAR_URL = 'https://calendar.google.com/calendar/ical/family11116426684739662442%40group.calendar.google.com/private-5a3d661447bc3df11465434fa3a1cb46/basic.ics';

// V.I.K.I. Supabase config - update with your anon key
const VIKI_SUPABASE_URL = 'https://khlkijcbfgljjpgxqxxm.supabase.co';
const VIKI_ANON_KEY = import.meta.env.VITE_VIKI_ANON_KEY || '';

export default function EventsCard() {
  const [todayEvents, setTodayEvents] = useState<Event[]>([]);
  const [tomorrowEvents, setTomorrowEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfter = new Date(tomorrow);
      dayAfter.setDate(dayAfter.getDate() + 1);

      // Fetch calendar events
      let calendarEvents: { date: Date; event: Event }[] = [];
      try {
        const res = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(CALENDAR_URL)}`);
        const icsData = await res.text();
        
        const eventRegex = /BEGIN:VEVENT[\s\S]*?END:VEVENT/g;
        const matches = icsData.match(eventRegex) || [];
        
        matches.forEach(block => {
          const summaryMatch = block.match(/SUMMARY:(.+)/);
          const dtstartMatch = block.match(/DTSTART[^:]*:(\d{8}T?\d{0,6})/);
          const dtendMatch = block.match(/DTEND[^:]*:(\d{8}T?\d{0,6})/);
          
          if (summaryMatch && dtstartMatch) {
            const summary = summaryMatch[1].trim();
            const dtstart = dtstartMatch[1];
            const dtend = dtendMatch ? dtendMatch[1] : dtstart;
            
            let startDate: Date;
            let isAllDay = false;
            if (dtstart.length === 8) {
              isAllDay = true;
              startDate = new Date(
                parseInt(dtstart.slice(0,4)),
                parseInt(dtstart.slice(4,6)) - 1,
                parseInt(dtstart.slice(6,8))
              );
            } else {
              startDate = new Date(
                parseInt(dtstart.slice(0,4)),
                parseInt(dtstart.slice(4,6)) - 1,
                parseInt(dtstart.slice(6,8)),
                parseInt(dtstart.slice(9,11) || '0'),
                parseInt(dtstart.slice(11,13) || '0')
              );
            }
            
            let endDate: Date;
            if (dtend.length === 8) {
              endDate = new Date(
                parseInt(dtend.slice(0,4)),
                parseInt(dtend.slice(4,6)) - 1,
                parseInt(dtend.slice(6,8))
              );
            } else {
              endDate = new Date(
                parseInt(dtend.slice(0,4)),
                parseInt(dtend.slice(4,6)) - 1,
                parseInt(dtend.slice(6,8)),
                parseInt(dtend.slice(9,11) || '0'),
                parseInt(dtend.slice(11,13) || '0')
              );
            }
            
            const startDay = new Date(startDate);
            startDay.setHours(0, 0, 0, 0);
            const endDay = new Date(endDate);
            endDay.setHours(0, 0, 0, 0);
            
            const timeStr = isAllDay 
              ? 'All day'
              : `${startDate.getHours().toString().padStart(2, '0')}:${startDate.getMinutes().toString().padStart(2, '0')}`;
            
            // Check for today
            if (startDay <= today && endDay >= today) {
              calendarEvents.push({
                date: today,
                event: { time: timeStr, title: summary, type: 'calendar' }
              });
            }
            // Check for tomorrow
            if (startDay <= tomorrow && endDay >= tomorrow) {
              calendarEvents.push({
                date: tomorrow,
                event: { time: timeStr, title: summary, type: 'calendar' }
              });
            }
          }
        });
      } catch (e) {
        console.error('Calendar fetch failed:', e);
      }

      // Fetch V.I.K.I. meals if key available
      let meals: { date: Date; event: Event }[] = [];
      if (VIKI_ANON_KEY) {
        try {
          const todayStr = today.toISOString().split('T')[0];
          const tomorrowStr = tomorrow.toISOString().split('T')[0];
          
          const res = await fetch(
            `${VIKI_SUPABASE_URL}/rest/v1/meal_plans?select=*,recipes(name)&date=gte.${todayStr}&date=lte.${tomorrowStr}`,
            {
              headers: {
                'apikey': VIKI_ANON_KEY,
                'Authorization': `Bearer ${VIKI_ANON_KEY}`
              }
            }
          );
          
          if (res.ok) {
            const data = await res.json();
            data.forEach((meal: any) => {
              const mealDate = new Date(meal.date);
              mealDate.setHours(0, 0, 0, 0);
              const mealType = meal.meal_type || 'Meal';
              const recipeName = meal.recipes?.name || meal.recipe_name || 'Planned meal';
              
              meals.push({
                date: mealDate,
                event: {
                  time: mealType.charAt(0).toUpperCase() + mealType.slice(1),
                  title: `🍽️ ${recipeName}`,
                  type: 'meal'
                }
              });
            });
          }
        } catch (e) {
          console.error('V.I.K.I. fetch failed:', e);
        }
      }

      // Combine and sort
      const allEvents = [...calendarEvents, ...meals];
      
      const todayList = allEvents
        .filter(e => e.date.getTime() === today.getTime())
        .map(e => e.event)
        .sort((a, b) => {
          if (a.time === 'All day') return -1;
          if (b.time === 'All day') return 1;
          return a.time.localeCompare(b.time);
        });
      
      const tomorrowList = allEvents
        .filter(e => e.date.getTime() === tomorrow.getTime())
        .map(e => e.event)
        .sort((a, b) => {
          if (a.time === 'All day') return -1;
          if (b.time === 'All day') return 1;
          return a.time.localeCompare(b.time);
        });

      setTodayEvents(todayList);
      setTomorrowEvents(tomorrowList);
      setLoading(false);
    };

    fetchData();
    const interval = setInterval(fetchData, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const renderEvents = (events: Event[], emptyMsg: string) => (
    <div className="events-list">
      {loading ? (
        <div className="events-empty">Loading...</div>
      ) : events.length === 0 ? (
        <div className="events-empty">{emptyMsg}</div>
      ) : (
        events.map((event, idx) => (
          <div 
            key={idx} 
            className={`event-item ${event.type === 'meal' ? 'meal-item' : ''}`}
          >
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
        {renderEvents(todayEvents, 'No events today')}
      </div>
      <div className="card card-dark events-card">
        <h2 className="events-title">What is happening tomorrow</h2>
        {renderEvents(tomorrowEvents, 'No events tomorrow')}
      </div>
    </div>
  );
}
