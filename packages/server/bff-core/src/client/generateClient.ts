import * as path from 'path';
import type { HttpMethodDecider } from '@modern-js/types';
import { ApiRouter } from '../router';
import { Err, Ok, type Result } from './result';

/**
 * Get package name from package.json file
 * @param appDir - Application directory path
 * @returns Package name or undefined if not found
 */
const getPackageName = (appDir: string): string | undefined => {
  try {
    const packageJsonPath = path.resolve(appDir, './package.json');
    const packageJson = require(packageJsonPath);
    return packageJson.name;
  } catch (error) {
    // If package.json doesn't exist or is invalid, return undefined
    return undefined;
  }
};

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

export const INNER_CLIENT_REQUEST_CREATOR = '@modern-js/plugin-bff/client';

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
  requestCreator = requestCreator || INNER_CLIENT_REQUEST_CREATOR;

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

    const requestId =
      target === 'bundle'
        ? getPackageName(appDir) || process.env.npm_package_name
        : undefined;

    if (action === 'upload') {
      const requestOptions = {
        path: routeName,
        domain,
        requestId,
      };
      handlersCode += `export ${exportStatement} createUploader(${JSON.stringify(requestOptions)});`;
    } else {
      const portValue =
        target === 'server'
          ? `process.env.PORT || ${String(port)}`
          : String(port);

      const optionsStr = `{
        path: '${routeName}',
        method: '${upperHttpMethod}',
        port: ${portValue},
        httpMethodDecider: '${httpMethodDecider || 'functionName'}'
        ${domain ? `, domain: '${domain}'` : ''}
        ${fetcher ? ", fetch: 'fetch'" : ''}
        ${requestId ? `, requestId: '${requestId}'` : ''}
      }`.replace(/\n\s*/g, '');

      handlersCode += `export ${exportStatement} createRequest(${optionsStr});
      `;
    }
  }

  const importCode = `import { createRequest${
    handlerInfos.find(i => i.action === 'upload') ? ', createUploader' : ''
  } } from '${requestCreator}';
${fetcher ? `import { fetch } from '${fetcher}';\n` : ''}`;

  return Ok(`${importCode}\n${handlersCode}`);
};
