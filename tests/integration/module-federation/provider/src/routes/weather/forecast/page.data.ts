import { loadWeather } from '../load-weather';
export const loader = ({ request }: { request: Request }) =>
  loadWeather('forecast', request);
