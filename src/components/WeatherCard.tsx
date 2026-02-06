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
        const res = await fetch('https://wttr.in/Princes+Risborough?format=j1');
        const data = await res.json();
        
        const current = data.current_condition[0];
        const desc = current.weatherDesc[0].value.toLowerCase();
        
        // Map weather to icons
        let icon = '☀️';
        if (desc.includes('cloud') || desc.includes('overcast')) icon = '☁️';
        else if (desc.includes('rain') || desc.includes('drizzle')) icon = '🌧️';
        else if (desc.includes('snow')) icon = '❄️';
        else if (desc.includes('thunder')) icon = '⛈️';
        else if (desc.includes('fog') || desc.includes('mist')) icon = '🌫️';
        else if (desc.includes('sun') || desc.includes('clear')) icon = '☀️';
        else if (desc.includes('partly')) icon = '⛅';
        
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
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (!weather) {
    return (
      <div className="weather-section">
        <div className="weather-visual">
          <span style={{ fontSize: '80px' }}>🌤️</span>
        </div>
        <div className="weather-info">
          <div className="weather-temp">--°</div>
          <div className="weather-desc">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="weather-section">
      <div className="weather-visual">
        {weather.icon === '☁️' || weather.icon === '⛅' ? (
          <div className="cloud-sun-icon">
            <span className="sun-behind">☀️</span>
            <span className="cloud-front">☁️</span>
          </div>
        ) : (
          <span style={{ fontSize: '80px' }}>{weather.icon}</span>
        )}
      </div>
      <div className="weather-info">
        <div className="weather-temp">{weather.temp}°</div>
        <div className="weather-desc">
          Today will be {weather.condition.toLowerCase()}.<br/>
          Feels like {weather.feelsLike}°
        </div>
      </div>
    </div>
  );
}
