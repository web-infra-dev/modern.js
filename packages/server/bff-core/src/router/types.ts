import { HttpMethod } from '../types';

export type ModuleInfo = {
  filename: string;
  module: HandlerModule;
};

type Handler = (...args: any) => any | Promise<any>;

export type ApiHandler = Handler;

export type HandlerModule = Record<string, ApiHandler>;

export type APIHandlerInfo = {
  handler: ApiHandler;
  // handler name
  name: string;
  httpMethod: HttpMethod;
  filename: string;
  routeName: string;
  // prefix+ routeName
  routePath: string;
};
