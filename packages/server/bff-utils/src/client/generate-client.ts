import * as path from 'path';
import { HttpMethod } from '../constant';
import { isAllowedHttpMethod } from '../utils';
import { Result, Ok, Err } from './result';
import { getRouteName } from './get-route-name';
import { checkSource } from './check-source';

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
  source,
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

  const routeResult = getRouteName(resourcePath, apiDir);
  if (routeResult.isErr) {
    return routeResult;
  }

  const checkSourceResult = await checkSource(source);
  if (checkSourceResult.isErr) {
    return Err(checkSourceResult.value);
  }

  const routeName = prefix + routeResult.value;
  let handlersCode = '';
  for (const name of checkSourceResult.value) {
    const result = getMethodAndStatementFromName(name);
    if (result.isErr) {
      return result;
    }

    const [method, exportStatement] = result.value;

    handlersCode += `export ${exportStatement} createRequest('${routeName}', '${method}', process.env.PORT || ${String(
      port,
    )}${fetcher ? `, fetch` : ''});
`;
  }

  const importCode = `import { createRequest } from '${requestCreator}';
${fetcher ? `import { fetch } from '${fetcher}';\n` : ''}`;

  return Ok(`${importCode}\n${handlersCode}`);
};

export const getMethodAndStatementFromName = (
  name: string,
): Result<[HttpMethod, string]> => {
  const upperName = name.toUpperCase();

  if (isAllowedHttpMethod(upperName)) {
    return Ok([upperName, `const ${name} =`]);
  } else {
    // default export to GET
    if (upperName === 'DEFAULT') {
      return Ok([HttpMethod.GET, `default`]);
    }

    // del to delete
    if (upperName === 'DEL') {
      return Ok([HttpMethod.DELETE, `const ${name} =`]);
    }
    return Err(`Unknown HTTP Method: ${upperName}`);
  }
};
