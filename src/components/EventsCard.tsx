import { useCache } from '../hooks/useCache';
import { fetchCalendarData, fetchVikiData } from '../utils/api';
import type { DashboardEvent, MealsBySlot } from '../types';

export default function EventsCard() {
  const { data: calendarData, loading: calendarLoading } = useCache('calendar-events', fetchCalendarData, 300000); // 5 min cache
  const { data: vikiData, loading: vikiLoading } = useCache('viki-meals', fetchVikiData, 300000); // 5 min cache

  const loading = calendarLoading && vikiLoading && !calendarData && !vikiData;

  const todayEvents = calendarData?.today || [];
  const tomorrowEvents = calendarData?.tomorrow || [];
  const todayMeals = vikiData?.today || {};
  const tomorrowMeals = vikiData?.tomorrow || {};

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

  const renderEvents = (events: DashboardEvent[], emptyMsg: string) => (
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
