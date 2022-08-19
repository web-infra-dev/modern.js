import { DecoderFinalOptions } from '.';
import type { LoaderDefinition } from 'webpack';
import { ImagePool } from '@squoosh/lib';
import { cpus } from 'os';
import { Buffer } from 'buffer';

const imagePool = new ImagePool(cpus().length - 1);

const imageProcessor = async (source: Buffer, options: DecoderFinalOptions) => {
  const img = imagePool.ingestImage(Buffer.from(source));
  const result = await img.encode({ [options.use]: options });
  return result[options.use];
};

/* eslint-disable @babel/no-invalid-this */
const loader: LoaderDefinition<DecoderFinalOptions> = function loader(source) {
  const callback = this.async();
  const opt = this.getOptions();
  const buf = Buffer.from(source);
  imageProcessor(buf, opt)
    .then(result => callback(null, Buffer.from(result.binary)))
    .catch(err => callback(err));
};
/* eslint-enable */

export default loader;
