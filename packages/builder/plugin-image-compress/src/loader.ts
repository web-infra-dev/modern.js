import type { LoaderContext } from 'webpack';
import { Buffer } from 'buffer';
import { FinalOptions } from './types';
import Codecs from './shared/codecs';

/* eslint-disable @babel/no-invalid-this */
export function loader(this: LoaderContext<FinalOptions>, content: string) {
  const callback = this.async();
  const rawOptions = this.getOptions();
  const codec = Codecs[rawOptions.use];
  if (!codec) {
    throw new Error(`Codec ${rawOptions.use} is not supported`);
  }
  const opts = { ...codec.defaultOptions, ...rawOptions };
  if (this.resourcePath.match(opts.test)) {
    const buf = Buffer.from(content);
    codec
      .handler(buf, opts)
      .then(buf => callback(null, buf))
      .catch(err => callback(err));
  } else {
    callback(null, content);
  }
}
/* eslint-enable */

export const raw = true;

export default loader;
