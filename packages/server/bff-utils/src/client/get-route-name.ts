import path from 'path';
import { getAllAPIFiles, getLambdaDir } from '../utils';
import { INDEX_SUFFIX } from '../constant';
import { Result, Err, Ok } from './result';

export type RouteResult = Result<string>;

export const getRouteName = (
  resourcePath: string,
  apiDir: string,
): RouteResult => {
  if (!path.isAbsolute(apiDir)) {
    return Err(`API dir path: ${apiDir} is not absolute`);
  }

  if (!path.isAbsolute(resourcePath)) {
    return Err(`API file path: ${resourcePath} is not absolute`);
  }

  const lambdaDir = getLambdaDir(apiDir);
  // TODO: 这里应该加缓存
  const allApis = getAllAPIFiles(lambdaDir);

  if (resourcePath.startsWith(lambdaDir)) {
    if (!allApis.includes(resourcePath)) {
      return Err('Invalid API definition file');
    }

    const absoluteName = resourcePath.split('.').slice(0, -1).join('.');

    const relativeName = absoluteName.substring(lambdaDir.length);

    const draftName = relativeName
      .split(path.sep)
      .map(item => {
        if (item.length > 2) {
          if (item.startsWith('[') && item.endsWith(']')) {
            return `:${item.substring(1, item.length - 1)}`;
          }
        }

        return item;
      })
      .join('/');

    const name = draftName.endsWith(INDEX_SUFFIX)
      ? draftName.substring(0, draftName.length - INDEX_SUFFIX.length - 1)
      : draftName;

    return Ok(name);
  } else {
    return Err(`API file is not in API dir: ${lambdaDir}`);
  }
};
