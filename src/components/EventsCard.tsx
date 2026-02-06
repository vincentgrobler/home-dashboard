import { useState, useEffect } from 'react';

interface CalendarEvent {
  time: string;
  title: string;
  type: 'calendar' | 'meal';
}

const CALENDAR_URL = 'https://calendar.google.com/calendar/ical/family11116426684739662442%40group.calendar.google.com/private-5a3d661447bc3df11465434fa3a1cb46/basic.ics';

// V.I.K.I. Supabase - will need anon key for public access
// const VIKI_SUPABASE_URL = 'https://khlkijcbfgljjpgxqxxm.supabase.co';

export default function EventsCard() {
  const [todayEvents, setTodayEvents] = useState<CalendarEvent[]>([]);
  const [tomorrowEvents, setTomorrowEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        // Fetch calendar via proxy (CORS)
        const res = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(CALENDAR_URL)}`);
        const icsData = await res.text();
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dayAfter = new Date(tomorrow);
        dayAfter.setDate(dayAfter.getDate() + 1);
        
        const eventRegex = /BEGIN:VEVENT[\s\S]*?END:VEVENT/g;
        const matches = icsData.match(eventRegex) || [];
        
        const todayList: CalendarEvent[] = [];
        const tomorrowList: CalendarEvent[] = [];
        
        matches.forEach(block => {
          const summaryMatch = block.match(/SUMMARY:(.+)/);
          const dtstartMatch = block.match(/DTSTART[^:]*:(\d{8}T?\d{0,6})/);
          const dtendMatch = block.match(/DTEND[^:]*:(\d{8}T?\d{0,6})/);
          
          if (summaryMatch && dtstartMatch) {
            const summary = summaryMatch[1].trim();
            const dtstart = dtstartMatch[1];
            const dtend = dtendMatch ? dtendMatch[1] : dtstart;
            
            // Parse dates
            const parseDate = (dt: string) => {
              if (dt.length === 8) {
                return new Date(parseInt(dt.slice(0,4)), parseInt(dt.slice(4,6)) - 1, parseInt(dt.slice(6,8)));
              }
              return new Date(
                parseInt(dt.slice(0,4)), parseInt(dt.slice(4,6)) - 1, parseInt(dt.slice(6,8)),
                parseInt(dt.slice(9,11) || '0'), parseInt(dt.slice(11,13) || '0')
              );
            };
            
            const startDate = parseDate(dtstart);
            const endDate = parseDate(dtend);
            const startDay = new Date(startDate); startDay.setHours(0,0,0,0);
            const endDay = new Date(endDate); endDay.setHours(0,0,0,0);
            
            const timeStr = dtstart.length > 8 
              ? `${startDate.getHours().toString().padStart(2, '0')}:${startDate.getMinutes().toString().padStart(2, '0')}`
              : 'All day';
            
            const event: CalendarEvent = {
              time: timeStr,
              title: summary,
              type: 'calendar'
            };
            
            // Check today
            if (startDay <= today && endDay >= today) {
              todayList.push(event);
            }
            // Check tomorrow
            if (startDay <= tomorrow && endDay >= tomorrow) {
              tomorrowList.push(event);
            }
          }
        });
        
        // Sort by time
        const sortEvents = (events: CalendarEvent[]) => 
          events.sort((a, b) => {
            if (a.time === 'All day') return -1;
            if (b.time === 'All day') return 1;
            return a.time.localeCompare(b.time);
          });
        
        setTodayEvents(sortEvents(todayList));
        setTomorrowEvents(sortEvents(tomorrowList));
        
        // TODO: Fetch meals from V.I.K.I. Supabase
        // Need household ID and anon key to fetch meal planning
        
      } catch (e) {
        console.error('Calendar fetch failed:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
    const interval = setInterval(fetchEvents, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const renderEventList = (events: CalendarEvent[], emptyText: string) => (
    <div className="events-list">
      {loading ? (
        <div style={{ textAlign: 'center', color: '#888', fontSize: '12px' }}>Loading...</div>
      ) : events.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#666', padding: '8px', fontSize: '12px' }}>
          {emptyText}
        </div>
      ) : (
        events.slice(0, 4).map((event, idx) => (
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
    <div className="card card-dark events-card">
      <div className="events-section">
        <h3 className="events-subtitle">What is happening today</h3>
        {renderEventList(todayEvents, 'No events today')}
      </div>
      
      <div className="events-divider" />
      
      <div className="events-section">
        <h3 className="events-subtitle">What is happening tomorrow</h3>
        {renderEventList(tomorrowEvents, 'No events tomorrow')}
      </div>
    </div>
  );
}
