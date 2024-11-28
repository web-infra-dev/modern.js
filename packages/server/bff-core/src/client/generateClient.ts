import * as path from 'path';
import type { HttpMethodDecider } from '@modern-js/types';
import { ApiRouter } from '../router';
import { Err, Ok, type Result } from './result';

export type GenClientResult = Result<string>;

export type GenClientOptions = {
  resourcePath: string;
  source: string;
  appDir: string;
  apiDir: string;
  lambdaDir: string;
  prefix: string;
  port: number;
  requestCreator?: string;
  fetcher?: string;
  target?: string;
  requireResolve?: typeof require.resolve;
  httpMethodDecider?: HttpMethodDecider;
  domain?: string;
};

export const DEFAULT_CLIENT_REQUEST_CREATOR = '@modern-js/create-request';

export const generateClient = async ({
  appDir,
  resourcePath,
  apiDir,
  lambdaDir,
  prefix,
  port,
  target,
  requestCreator,
  fetcher,
  requireResolve = require.resolve,
  httpMethodDecider,
  domain,
}: GenClientOptions): Promise<GenClientResult> => {
  if (!requestCreator) {
    requestCreator = requireResolve(
      `${DEFAULT_CLIENT_REQUEST_CREATOR}${target ? `/${target}` : ''}`,
    ).replace(/\\/g, '/');
  } else {
    let resolvedPath = requestCreator;
    try {
      resolvedPath = path.dirname(requireResolve(requestCreator));
    } catch (error) {}
    requestCreator = `${resolvedPath}${target ? `/${target}` : ''}`.replace(
      /\\/g,
      '/',
    );
  }

  const apiRouter = new ApiRouter({
    appDir,
    apiDir,
    lambdaDir,
    prefix,
    httpMethodDecider,
  });
  const handlerInfos = await apiRouter.getSingleModuleHandlers(resourcePath);
  if (!handlerInfos) {
    return Err(`generate client error: Cannot require module ${resourcePath}`);
  }

  let handlersCode = '';
  for (const handlerInfo of handlerInfos) {
    const { name, httpMethod, routePath, action } = handlerInfo;
    let exportStatement = `var ${name} =`;
    if (name.toLowerCase() === 'default') {
      exportStatement = 'default';
    }
    const upperHttpMethod = httpMethod.toUpperCase();

    const routeName = routePath;

    if (action === 'upload') {
      const requestOptions = {
        path: routeName,
        domain,
      };
      handlersCode += `export ${exportStatement} createUploader(${JSON.stringify(requestOptions)});`;
    } else {
      const requestOptions = {
        path: routeName,
        method: upperHttpMethod,
        port: process.env.PORT || port,
        httpMethodDecider: httpMethodDecider || 'functionName',
        domain,
        ...(fetcher ? { fetch: 'fetch' } : {}),
      };
      handlersCode += `export ${exportStatement} createRequest(${JSON.stringify(requestOptions)});
      `;
    }
  }

  const importCode = `import { createRequest${
    handlerInfos.find(i => i.action === 'upload') ? ', createUploader' : ''
  } } from '${requestCreator}';
${fetcher ? `import { fetch } from '${fetcher}';\n` : ''}`;

  return Ok(`${importCode}\n${handlersCode}`);
};
