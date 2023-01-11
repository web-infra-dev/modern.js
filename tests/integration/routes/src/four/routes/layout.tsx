import { Link, Outlet } from '@modern-js/runtime/router';
import type { RuntimeContext } from '@modern-js/runtime';

declare global {
  interface Window {
    __isBrowser: boolean;
  }
}

export const init = (context: RuntimeContext) => {
  window.__isBrowser = context.isBrowser;
  return context;
};

// export const config = (): AppConfig => {
//   return {
//     router: {
//       createRoutes() {
//         return [
//           {
//             path: 'yyy/xxx',
//             element: <div>yyy/xxx</div>,
//           },
//         ];
//       },
//     },
//   }
// };

export default function Layout() {
  return (
    <div>
      root layout
      <Link to="/user">/user</Link>
      <Link to="/user/profile">/user/profile</Link>
      <Outlet />
    </div>
  );
}
