import type { NodeRequest, NodeResponse } from './server';
import type { DevProxyOptions, NextFunction } from './utils';

export type DevServerHttpsOptions = boolean | { key: string; cert: string };

export type RequestHandler = (
  req: NodeRequest,
  res: NodeResponse,
  next: NextFunction,
) => void;

export type ExposeServerApis = {
  sockWrite: (
    type: string,
    data?: string | boolean | Record<string, any>,
  ) => void;
};
