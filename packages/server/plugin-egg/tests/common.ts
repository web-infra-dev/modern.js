type Handler<T1, T2> = ({ req, res }: { req: T1; res: T2 }) => any;

// globby needs setImmediate
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
global.setImmediate = setTimeout;
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
global.clearImmediate = clearTimeout;

export const flattenFuncArgs =
  <T1, T2>(handler: Handler<T1, T2>) =>
  (req: T1, res: T2) =>
    handler({ req, res });
