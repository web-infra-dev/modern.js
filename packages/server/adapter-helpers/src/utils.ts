type HanlderInfo = {
  handler: (...args: any[]) => any;
  method: string;
  name: string;
};

const sortDynamicRoutes = (apiHandlers: HanlderInfo[]) => {
  apiHandlers.forEach((apiHandler, handlerIndex) => {
    if (apiHandler.name.includes(':')) {
      apiHandlers.splice(handlerIndex, 1);
      apiHandlers.push(apiHandler);
    }
  });
};

export { sortDynamicRoutes };
