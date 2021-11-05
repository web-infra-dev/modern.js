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
  }

  const routeRsult = getRouteName(resourcePath, apiDir);
  if (routeRsult.isErr) {
    return routeRsult;
  }

  const checkSourceResult = await checkSource(source);
  if (checkSourceResult.isErr) {
    return Err(checkSourceResult.value);
  }

  const routeName = prefix + routeRsult.value;
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
