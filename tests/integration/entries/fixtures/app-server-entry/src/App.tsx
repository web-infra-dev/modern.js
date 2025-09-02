import { RouterProvider, createBrowserRouter } from '@modern-js/runtime/router';
import { routes } from './routes';

const App = () => {
  const router = createBrowserRouter(routes);
  return <RouterProvider router={router} />;
};

export default App;
