import { generateClient, GenClientOptions } from '@modern-js/bff-core';
import type { LoaderContext } from 'webpack';

export type APILoaderOptions = {
  prefix: string;
  apiDir: string;
  port: number;
  fetcher?: string;
  requestCreator?: string;
  target: string;
};

async function loader(this: LoaderContext<APILoaderOptions>, source: string) {
  // eslint-disable-next-line @babel/no-invalid-this
  this.cacheable();
  // eslint-disable-next-line @babel/no-invalid-this
  const callback = this.async();
  // eslint-disable-next-line @babel/no-invalid-this
  const draftOptions = this.getOptions();

  const options: GenClientOptions = {
    prefix: (Array.isArray(draftOptions.prefix)
      ? draftOptions.prefix[0]
      : draftOptions.prefix) as string,
    apiDir: draftOptions.apiDir,
    target: draftOptions.target,
    port: Number(draftOptions.port),
    source,
    // eslint-disable-next-line @babel/no-invalid-this
    resourcePath: this.resourcePath,
  };

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
