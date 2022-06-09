import { Handler, SchemaHandler } from '@modern-js/bff-runtime';
import { HttpMethod } from '../types';

export type ModuleInfo = {
  filename: string;
  module: HandlerModule;
};

export type ApiHandler = Handler<any, any> | SchemaHandler<any, any>;

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
