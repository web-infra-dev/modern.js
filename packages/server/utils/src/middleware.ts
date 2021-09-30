export type CollectMiddlewaresResult = {
  web: any[];
  api: any[];
  ssr: any[];
};

export const createMiddlewareCollecter = () => {
  const webMiddlewares: any[] = [];
  const apiMiddlewares: any[] = [];
  const ssrMiddlewares: any[] = [];

  const addWebMiddleware = (input: any) => {
    webMiddlewares.push(input);
  };

  const addAPIMiddleware = (input: any) => {
    apiMiddlewares.push(input);
  };

  const addSSRMiddleware = (input: any) => {
    ssrMiddlewares.push(input);
  };

  const getMiddlewares = (): CollectMiddlewaresResult => ({
    web: webMiddlewares,
    api: apiMiddlewares,
    ssr: ssrMiddlewares,
  });
  return {
    getMiddlewares,
    addWebMiddleware,
    addAPIMiddleware,
    addSSRMiddleware,
  };
};

export type AttacherOptions = {
  addMiddleware: (...input: any[]) => void;
};

export type Attacher = (options: AttacherOptions) => void;

export const hook = (attacher: Attacher) => attacher;
