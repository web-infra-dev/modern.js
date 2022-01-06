export type CollectMiddlewaresResult = {
  web: any[];
  api: any[];
};

export const createMiddlewareCollecter = () => {
  const webMiddlewares: any[] = [];
  const apiMiddlewares: any[] = [];

  const addWebMiddleware = (input: any) => {
    webMiddlewares.push(input);
  };

  const addAPIMiddleware = (input: any) => {
    apiMiddlewares.push(input);
  };

  const getMiddlewares = (): CollectMiddlewaresResult => ({
    web: webMiddlewares,
    api: apiMiddlewares,
  });
  return {
    getMiddlewares,
    addWebMiddleware,
    addAPIMiddleware,
  };
};

export type AttacherOptions = {
  addMiddleware: (...input: any[]) => void;
};

export type Attacher = (options: AttacherOptions) => void;

export const hook = (attacher: Attacher) => attacher;
