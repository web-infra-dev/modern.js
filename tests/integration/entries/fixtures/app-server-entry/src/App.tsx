import { createBrowserRouter, RouterProvider } from '@modern-js/runtime/router';
import { routes } from './routes';

const App = () => {
  const router = createBrowserRouter(routes);
  return <RouterProvider router={router} />;
};

App.init = () => {
  console.log('init');
};

export default App;
