import { createContext } from '@modern-js/plugin';
import { isSchemaHandler } from '@modern-js/bff-runtime';
import { createApi, ApiEntries } from 'farrow-api';
import { toJSON } from 'farrow-api/dist/toJSON';
import {
  INTROSPECTION_ROUTE_PATH,
  INTROSPECTION_ROUTE_METHOD,
} from '../constant';
import { APIHandlerInfo, extractAPIHandlers } from './extract-api-handlers';

export type ExtraAPIHandlerInfo = APIHandlerInfo & {
  path?: string;
};

const APIHandlerInfosContext = createContext<ExtraAPIHandlerInfo[]>([]);

export const useAPIHandlerInfos = (): ExtraAPIHandlerInfo[] =>
  APIHandlerInfosContext.use().value;

export const injectAPIHandlerInfos = (apiDir: string, prefix?: string) => {
  let apiHandlerInfos = extractAPIHandlers(apiDir);

  const apiEntries: ApiEntries = {};
  for (const apiInfo of apiHandlerInfos) {
    const { name, handler } = apiInfo;

    if (isSchemaHandler(handler)) {
      apiEntries[name] = createApi({
        ...handler.schema,
        input: handler.schema.request,
        output: handler.schema.response,
      });
    }
  }

  apiHandlerInfos.push({
    name: INTROSPECTION_ROUTE_PATH,
    handler: () => toJSON(apiEntries),
    method: INTROSPECTION_ROUTE_METHOD,
  });

  if (prefix && prefix !== '/') {
    apiHandlerInfos = apiHandlerInfos.map(({ name, handler, method }) => ({
      handler,
      method,
      name,
      path: `${prefix}${name}`,
    }));
  }

  APIHandlerInfosContext.set(apiHandlerInfos);
};
