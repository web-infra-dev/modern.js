import { getOptions } from 'loader-utils';
import { generateClient, GenClientOptions } from '@modern-js/bff-utils';
import { LoaderContext } from 'webpack';

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
  const draftOptions = getOptions(this as any);

  const options: GenClientOptions = {
    prefix: draftOptions.prefix as string,
    apiDir: draftOptions.apiDir as string,
    target: draftOptions.target as string,
    port: Number(draftOptions.port),
    source,
    // eslint-disable-next-line @babel/no-invalid-this
    resourcePath: this.resourcePath,
  };

  if (draftOptions.fetcher) {
    options.fetcher = draftOptions.fetcher as string;
  }

  if (draftOptions.requestCreator) {
    options.requestCreator = draftOptions.requestCreator as string;
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
