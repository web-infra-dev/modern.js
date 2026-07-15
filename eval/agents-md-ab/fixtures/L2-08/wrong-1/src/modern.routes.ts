import { createBrowserRouter } from 'react-router-dom';
import Home from './home';

export const router = createBrowserRouter([
  { path: '/home', element: <Home /> },
]);
