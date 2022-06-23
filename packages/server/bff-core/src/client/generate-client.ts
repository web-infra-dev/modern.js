import * as path from 'path';
import { ApiRouter } from '../router';
import { Result, Ok, Err } from './result';

export type GenClientResult = Result<string>;

export type GenClientOptions = {
  resourcePath: string;
  source: string;
  apiDir: string;
  prefix: string;
  port: number;
  requestCreator?: string;
  fetcher?: string;
  target?: string;
  requireResolve?: typeof require.resolve;
};

export const DEFAULT_CLIENT_REQUEST_CREATOR = '@modern-js/create-request';

export const generateClient = async ({
  resourcePath,
  apiDir,
  prefix,
  port,
  target,
  requestCreator,
  fetcher,
  requireResolve = require.resolve,
}: GenClientOptions): Promise<GenClientResult> => {
  if (!requestCreator) {
    // eslint-disable-next-line no-param-reassign
    requestCreator = requireResolve(
      `${DEFAULT_CLIENT_REQUEST_CREATOR}${target ? `/${target}` : ''}`,
    ).replace(/\\/g, '/');
  } else {
    // 这里约束传入的 requestCreator 包也必须有两个导出 client 和 server，因为目前的机制 client 和 server 要导出不同的 configure 函数；该 api 不对使用者暴露，后续可优化
    let resolvedPath = requestCreator;
    try {
      resolvedPath = path.dirname(requireResolve(requestCreator));
    } catch (error) {}
    // eslint-disable-next-line no-param-reassign
    requestCreator = `${resolvedPath}${target ? `/${target}` : ''}`.replace(
      /\\/g,
      '/',
    );
  }

  const apiRouter = new ApiRouter({
    apiDir,
    prefix,
  });

  const handlerInfos = apiRouter.getSingleModuleHandlers(resourcePath);
  if (!handlerInfos) {
    return Err(`generate client error: Cannot require module ${resourcePath}`);
  }

  let handlersCode = '';
  for (const handlerInfo of handlerInfos) {
    const { name, httpMethod, routePath } = handlerInfo;
    let exportStatement = `const ${name} =`;
    if (name.toLowerCase() === 'default') {
      exportStatement = 'default';
    }
    const upperHttpMethod = httpMethod.toUpperCase();

    const routeName = routePath;
    handlersCode += `export ${exportStatement} createRequest('${routeName}', '${upperHttpMethod}', process.env.PORT || ${String(
      port,
    )}${fetcher ? `, fetch` : ''});
`;
  }

  const importCode = `import { createRequest } from '${requestCreator}';
${fetcher ? `import { fetch } from '${fetcher}';\n` : ''}`;

  return Ok(`${importCode}\n${handlersCode}`);
};
