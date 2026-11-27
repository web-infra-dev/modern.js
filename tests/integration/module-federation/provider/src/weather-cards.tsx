// Shared with the component comparison document and the routed application.
export function AirWeather() {
  return (
    <section className="weather-card air-weather">
      <h2>◌ Air quality</h2>
      <strong>49</strong>
      <p>Good</p>
      <div className="air-scale" />
      <small>Current AQI (CN): 49.</small>
    </section>
  );
}

export function UVWeather() {
  return (
    <section className="weather-card uv-weather">
      <h2>☀ UV index</h2>
      <strong>3</strong>
      <p>Moderate</p>
      <div className="air-scale" />
      <small>Use sun protection this afternoon.</small>
    </section>
  );
}

export function SunsetWeather() {
  return (
    <section className="weather-card sunset-weather">
      <h2>☼ Sunset</h2>
      <strong>17:24</strong>
      <svg viewBox="0 0 200 60" aria-hidden="true">
        <path
          d="M0 55Q100 -45 200 55"
          fill="none"
          stroke="#9edaff"
          strokeWidth="4"
        />
        <path d="M0 40h200" stroke="#b9e6ff" />
        <circle cx="128" cy="13" r="5" fill="white" />
      </svg>
      <small>Sunrise: 6:05 AM</small>
    </section>
  );
}
