import assert from 'assert';
import type { Rspack } from '@rsbuild/core';
import { logger } from 'rslog';
import { Image } from './image';
import { PLUGIN_NAME } from './shared/constants';
import type { ImageModule, ImageResource } from './types/image';

const BLUR_IMG_SIZE = 8;

async function process(this: Rspack.LoaderContext, content: Buffer) {
  const assetRequest = `${this.resource}.webpack[asset/resource]!=!${this.resource}`;
  const src = await this.importModule(assetRequest);
  logger.debug(`Loaded asset resource module: ${src}`);
  assert(typeof src === 'string', 'Expected image source to be a string');

  const image = await Image.create(content);
  const { width, height } = image.size();

  // Create the blurred thumbnail from the original image.
  const scale = BLUR_IMG_SIZE / Math.max(width, height);
  const thumbnail: ImageResource = {
    url: '',
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  };
  logger.debug(`Creating thumbnail: ${thumbnail.width}x${thumbnail.height}`);
  image.resize(thumbnail);

  const buf = await image.format('jpeg').toBuffer();
  thumbnail.url = `data:image/jpeg;base64,${buf.toString('base64')}`;
  logger.debug(`Created thumbnail: ${thumbnail.url}`);

  const data: ImageModule = { url: src, width, height, thumbnail };
  return `export default ${JSON.stringify(data)}`;
}

export default function loader(this: Rspack.LoaderContext, content: Buffer) {
  const callback = this.async();
  logger.debug(`${PLUGIN_NAME} loader is processing: ${this.request}`);

  process
    .call(this, content)
    .then(content => callback(null, content))
    .catch(err => callback(err));
}

export const raw = true;
