declare module 'virtual-routes' {
  interface Route {
    path: string;
    element: React.ReactElement;
    filePath: string;
    preload: () => Promise<void>;
  }
  export const routes: Route[];
}
