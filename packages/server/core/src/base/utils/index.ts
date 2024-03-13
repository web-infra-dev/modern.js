export * from './env';
export * from './request';
// export * from './serverConfig';
// export * from './debug';
export * from './transformStream';
export * from './middlewareCollector';
export * from './error';
export * from './warmup';
export * from './entry';

export const cutNameByHyphen = (s: string) => {
  return s.split(/[-_]/)[0];
};
