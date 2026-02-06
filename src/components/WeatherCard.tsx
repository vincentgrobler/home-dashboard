import { useState, useEffect } from 'react';

interface WeatherData {
  temp: string;
  feelsLike: string;
  condition: string;
  icon: string;
}

export default function WeatherCard() {
  const [weather, setWeather] = useState<WeatherData | null>(null);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        // Fetch weather data
        const res = await fetch('https://wttr.in/Princes+Risborough?format=j1');
        const data = await res.json();
        
        const current = data.current_condition[0];
        const weatherCode = parseInt(current.weatherCode);
        
        // Map weather codes to icons
        let icon = '☀️';
        if (weatherCode >= 200 && weatherCode < 300) icon = '⛈️';
        else if (weatherCode >= 300 && weatherCode < 400) icon = '🌧️';
        else if (weatherCode >= 500 && weatherCode < 600) icon = '🌧️';
        else if (weatherCode >= 600 && weatherCode < 700) icon = '❄️';
        else if (weatherCode >= 700 && weatherCode < 800) icon = '🌫️';
        else if (current.weatherDesc[0].value.toLowerCase().includes('cloud')) icon = '☁️';
        else if (current.weatherDesc[0].value.toLowerCase().includes('sun')) icon = '☀️';
        else if (current.weatherDesc[0].value.toLowerCase().includes('rain')) icon = '🌧️';
        else if (current.weatherDesc[0].value.toLowerCase().includes('overcast')) icon = '☁️';
        
        setWeather({
          temp: current.temp_C,
          feelsLike: current.FeelsLikeC,
          condition: current.weatherDesc[0].value,
          icon
        });
      } catch (e) {
        console.error('Weather fetch failed:', e);
      }
    };

    fetchWeather();
    const interval = setInterval(fetchWeather, 30 * 60 * 1000); // Every 30 min
    return () => clearInterval(interval);
  }, []);

  if (!weather) {
    return (
      <div className="card weather-card">
        <div className="weather-icon">🌤️</div>
        <div className="weather-temp">--°</div>
        <div className="weather-desc">Loading...</div>
      </div>
    );
  }

  return (
    <div className="card weather-card">
      <div className="weather-icon">{weather.icon}</div>
      <div className="weather-temp">{weather.temp}°</div>
      <div className="weather-desc">
        {weather.condition}<br />
        Feels like {weather.feelsLike}°
      </div>
    </div>
  );
}
