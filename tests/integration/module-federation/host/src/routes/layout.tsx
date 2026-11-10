import { Outlet } from '@modern-js/runtime/router';
import '../weather-base.css';
import '../../../provider/src/weather-scene.css';
import '../weather.css';
export default function Layout() {
  return <Outlet />;
}
