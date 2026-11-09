import { useState } from 'react';
import {
  NavLink,
  Outlet,
  useLoaderData,
  useLocation,
  useOutletContext,
} from '@modern-js/runtime/router';
import type { WeatherData } from '../../weather-ui';
import { WeatherContext } from './state';
import '../../weather-scene.css';
import './weather-application.css';

// The station snapshot lives for the mounted application, independently of
// detail query changes. Each detail owns its own deferred request.
export const shouldRevalidate = () => false;

export default function WeatherLayout() {
  const { label = 'Hangzhou' } = useOutletContext<{ label?: string }>();
  const { weather } = useLoaderData() as { weather: WeatherData };
  const [saved, setSaved] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(0);
  const [angle, setAngle] = useState(340);
  const { pathname } = useLocation();
  const current = pathname.includes('/favorites')
    ? 'Favorites'
    : pathname.includes('/forecast/')
      ? 'Forecast detail'
      : pathname.includes('/forecast')
        ? '5-day forecast'
        : 'Overview';
  return (
    <WeatherContext.Provider
      value={{
        label,
        weather,
        saved,
        setSaved,
        favorites,
        toggleFavorite: day =>
          setFavorites(value =>
            value.includes(day)
              ? value.filter(item => item !== day)
              : [...value, day],
          ),
        filter,
        setFilter,
        selected,
        setSelected,
        angle,
        setAngle,
      }}
    >
      <section
        className="weather-scene weather-application"
        data-testid="weather-application"
      >
        <div className="sky-cloud cloud-one" />
        <div className="sky-cloud cloud-two" />
        <div className="weather-app-layout">
          <header className="weather-app-header">
            <div>
              <p>MY WEATHER / 杭州</p>
              <h1>{label}</h1>
              <span>Partly cloudy · A little room to slow down.</span>
            </div>
            <span>
              Local sample forecast
              <br />
              30.18° N · 120.15° E
            </span>
          </header>
          <nav className="weather-app-nav" aria-label="Weather pages">
            <NavLink
              to="overview"
              className={({ isActive }) =>
                isActive || current === 'Overview' ? 'active' : undefined
              }
            >
              Overview
            </NavLink>
            <NavLink to="forecast">5-day forecast</NavLink>
            <NavLink to="favorites">
              Favorites{' '}
              <span data-testid="favorite-count">
                {favorites.length + Number(saved)}
              </span>
            </NavLink>
          </nav>
          <div
            className="weather-app-breadcrumb"
            data-testid="weather-page-label"
          >
            {current}
          </div>
          <main>
            <Outlet />
          </main>
          <footer className="weather-app-footer">
            Your selections stay with you as you explore. Reconnecting starts a
            new visit.
          </footer>
        </div>
      </section>
    </WeatherContext.Provider>
  );
}
