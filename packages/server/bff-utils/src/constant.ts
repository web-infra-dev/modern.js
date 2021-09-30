export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  CONNECT = 'CONNECT',
  TRACE = 'TRACE',
  PATCH = 'PATCH',
  OPTION = 'OPTION',
  HEAD = 'HEAD',
}

export const AllHttpMethods = Object.values(HttpMethod) as string[];

export enum APIMode {
  /**
   * 框架模式
   */
  FARMEWORK = 'FARMEWORK',

  /**
   * 函数模式
   */
  FUNCTION = 'FUNCTION',
}

export const FRAMEWORK_MODE_LAMBDA_DIR = 'lambda';

export const INDEX_SUFFIX = 'index';

export const INTROSPECTION_ROUTE_PATH = '/__introspection__';

export const API_DIR = 'api';

export const INTROSPECTION_ROUTE_METHOD = 'GET';
