import { join } from 'path';
import { readFile } from 'fs/promises';
import { beforeAll, describe, expect, it } from 'vitest';
import { images } from '../tests/fixtures/images';
import { Image } from './image';

describe.each(images)('Image $filename ($width x $height)', data => {
  const { filename, width, height, buffer } = data;

  beforeAll(async () => {
    const image = await Image.create(buffer);
    image._debugName = filename;
  });

  it('should create an Image instance from buffer', async () => {
    const image = await Image.create(buffer);

    expect(image).toBeInstanceOf(Image);
    expect(image.size()).toEqual({ width, height });
  });

  it('should resize image correctly', async () => {
    const image = await Image.create(buffer);

    image.resize({ width: 64, height: 64 });

    expect(image.size()).toEqual({
      width: 64,
      height: 64,
    });
  });

  it('should convert image format', async () => {
    const image = await Image.create(buffer);

    const webpBuffer = await image.toFormat('webp', { quality: 80 }).toBuffer();

    expect(webpBuffer).toBeInstanceOf(Buffer);
    expect(webpBuffer.length).toBeGreaterThan(0);
  });
});
