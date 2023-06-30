import { generateClient, GenClientOptions } from '@modern-js/bff-core';
import type { HttpMethodDecider } from '@modern-js/types';
import type { LoaderContext } from 'webpack';
import { logger } from '@modern-js/utils';

export type APILoaderOptions = {
  prefix: string;
  appDir: string;
  apiDir: string;
  lambdaDir: string;
  existLambda: boolean;
  port: number;
  fetcher?: string;
  requestCreator?: string;
  target: string;
  httpMethodDecider?: HttpMethodDecider;
};

async function loader(this: LoaderContext<APILoaderOptions>, source: string) {
  this.cacheable();

  const { resourcePath } = this;

  delete require.cache[resourcePath];

  const callback = this.async();

  const draftOptions = this.getOptions();

  const warning = `The file ${resourcePath} is not allowd to be imported in src directory, only API definition files are allowed.`;

  if (!draftOptions.existLambda) {
    logger.warn(warning);
    callback(null, `throw new Error('${warning}')`);
    return;
  }

  const options: GenClientOptions = {
    prefix: (Array.isArray(draftOptions.prefix)
      ? draftOptions.prefix[0]
      : draftOptions.prefix) as string,
    appDir: draftOptions.appDir,
    apiDir: draftOptions.apiDir,
    lambdaDir: draftOptions.lambdaDir,
    target: draftOptions.target,
    port: Number(draftOptions.port),
    source,
    resourcePath,
    httpMethodDecider: draftOptions.httpMethodDecider,
  };

  const { lambdaDir } = draftOptions;
  if (!resourcePath.startsWith(lambdaDir)) {
    logger.warn(warning);
    callback(null, `throw new Error('${warning}')`);
    return;
  }

  if (draftOptions.fetcher) {
    options.fetcher = draftOptions.fetcher;
  }

  if (draftOptions.requestCreator) {
    options.requestCreator = draftOptions.requestCreator;
  }

  options.requireResolve = require.resolve;

  const result = await generateClient(options);

  if (result.isOk) {
    callback(undefined, result.value);
  } else {
    callback(undefined, `throw new Error('${result.value}')`);
  }
}

export default loader;
