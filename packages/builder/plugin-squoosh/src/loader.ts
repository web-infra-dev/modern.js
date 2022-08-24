import type { LoaderDefinition } from 'webpack';
import { Buffer } from 'buffer';
import { FinalOptions } from './types';
import compressors from './shared/compressor';

/* eslint-disable @babel/no-invalid-this */
const loader: LoaderDefinition<FinalOptions> = function loader(content) {
  const callback = this.async();
  const opt = this.getOptions();
  const buf = Buffer.from(content);
  const compressor = compressors[opt.compress];
  if (!compressor) {
    throw new Error(`Compressor ${opt.compress} is not supported`);
  }
  compressor
    .handler(buf, opt)
    .then(compressed => callback(null, compressed))
    .catch(err => callback(err));
};
/* eslint-enable */

export default loader;
