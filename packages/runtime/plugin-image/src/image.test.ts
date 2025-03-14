import { join } from 'path';
import { readFile } from 'fs/promises';
import { beforeAll, describe, expect, it } from 'vitest';
import { images } from '../tests/fixtures/images';
import { Image, isRotatedOrientation } from './image';

/**
 * 1. Normal orientation
 * 2. Flipped horizontally
 * 3. Rotated 180 degrees
 * 4. Flipped vertically
 * 5. Rotated 90 degrees clockwise and flipped horizontally
 * 6. Rotated 90 degrees clockwise
 * 7. Rotated 90 degrees clockwise and flipped vertically
 * 8. Rotated 90 degrees counterclockwise
 */
describe('isRotatedOrientation', () => {
  it('should throw errors for unsupported image types', () => {
    for (const type of ['png', 'gif', 'webp', '31j89d', '']) {
      for (const orientation of [1, 2, 3, 4, 5, 6, 7, 8]) {
        expect(() => isRotatedOrientation(type, orientation)).toThrow();
      }
    }
  });

  it('should return false for images without orientation', () => {
    expect(isRotatedOrientation('jpg')).toBe(false);
    expect(isRotatedOrientation('jpg', undefined)).toBe(false);
    expect(isRotatedOrientation('jpeg')).toBe(false);
    expect(isRotatedOrientation('jpeg', undefined)).toBe(false);
  });

  it('should detect rotated orientation', () => {
    const orientations = {
      1: false,
      2: false,
      3: false,
      4: false,
      5: true,
      6: true,
      7: true,
    };

    for (const [orientation, expected] of Object.entries(orientations)) {
      expect(isRotatedOrientation('jpg', Number(orientation))).toBe(expected);
      expect(isRotatedOrientation('jpeg', Number(orientation))).toBe(expected);
    }
  });
});

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

    const webpBuffer = await image.format('webp', { quality: 80 }).toBuffer();

    expect(webpBuffer).toBeInstanceOf(Buffer);
    expect(webpBuffer.length).toBeGreaterThan(0);
  });
});
