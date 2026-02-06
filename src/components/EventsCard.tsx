import { useState, useEffect } from 'react';

interface CalendarEvent {
  time: string;
  title: string;
  type: 'calendar' | 'meal';
}

const CALENDAR_URL = 'https://calendar.google.com/calendar/ical/family11116426684739662442%40group.calendar.google.com/private-5a3d661447bc3df11465434fa3a1cb46/basic.ics';

export default function EventsCard() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        // Fetch calendar via proxy (CORS)
        const res = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(CALENDAR_URL)}`);
        const icsData = await res.text();
        
        // Parse ICS
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const eventRegex = /BEGIN:VEVENT[\s\S]*?END:VEVENT/g;
        const matches = icsData.match(eventRegex) || [];
        
        const todayEvents: CalendarEvent[] = [];
        
        matches.forEach(block => {
          const summaryMatch = block.match(/SUMMARY:(.+)/);
          const dtstartMatch = block.match(/DTSTART[^:]*:(\d{8}T?\d{0,6})/);
          const dtendMatch = block.match(/DTEND[^:]*:(\d{8}T?\d{0,6})/);
          
          if (summaryMatch && dtstartMatch) {
            const summary = summaryMatch[1].trim();
            const dtstart = dtstartMatch[1];
            const dtend = dtendMatch ? dtendMatch[1] : dtstart;
            
            // Parse date
            let startDate: Date;
            if (dtstart.length === 8) {
              // All day event
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
            
            // Parse end date for spanning events
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
            
            // Check if event spans today
            const startDay = new Date(startDate);
            startDay.setHours(0, 0, 0, 0);
            const endDay = new Date(endDate);
            endDay.setHours(0, 0, 0, 0);
            
            if (startDay <= today && endDay >= today) {
              const timeStr = dtstart.length > 8 
                ? `${startDate.getHours().toString().padStart(2, '0')}:${startDate.getMinutes().toString().padStart(2, '0')}`
                : 'All day';
              
              todayEvents.push({
                time: timeStr,
                title: summary,
                type: summary.toLowerCase().includes('meal') || summary.toLowerCase().includes('dinner') || summary.toLowerCase().includes('lunch') || summary.toLowerCase().includes('breakfast') ? 'meal' : 'calendar'
              });
            }
          }
        });
        
        // Sort by time
        todayEvents.sort((a, b) => {
          if (a.time === 'All day') return -1;
          if (b.time === 'All day') return 1;
          return a.time.localeCompare(b.time);
        });
        
        setEvents(todayEvents);
      } catch (e) {
        console.error('Calendar fetch failed:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
    const interval = setInterval(fetchEvents, 15 * 60 * 1000); // Every 15 min
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="card card-dark events-card">
      <h2 className="events-title">What is happening today</h2>
      <div className="events-list">
        {loading ? (
          <div style={{ textAlign: 'center', color: '#888' }}>Loading...</div>
        ) : events.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#888', padding: '20px' }}>
            No events today
          </div>
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
    </div>
  );
}
