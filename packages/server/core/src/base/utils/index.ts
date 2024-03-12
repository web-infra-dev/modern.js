export * from './env';
export * from './request';
export * from './transformStream';
export * from './middlewareCollector';
export * from './error';
export * from './warmup';
export * from './entry';
export * from './path';
export * from './serverConfig';

export const cutNameByHyphen = (s: string) => {
  return s.split(/[-_]/)[0];
};
