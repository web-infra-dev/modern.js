import sharp, { type ResizeOptions } from 'sharp';
import { assert, beforeAll, describe, expect, it } from 'vitest';
import { images } from '../tests/fixtures/images';
import { Image, isRotatedOrientation } from './image';

describe('Sharp', () => {
  // Sunrise.jpg is a 100x75 image (without applying orientation).
  const image = images.find(image => image.filename === 'sunrise.jpg');
  assert(image);

  it('should mutate the original instance by resize', async () => {
    const img = sharp(image.buffer);
    const resized = img.resize({ width: 50, height: 50 });
    expect(resized).toBe(img);
  });

  it('should return new instance by clone', async () => {
    const img = sharp(image.buffer);
    const cloned = img.clone();
    expect(cloned).not.toBe(img);

    const resized = img.clone().resize({ width: 50, height: 50 });
    expect(resized).not.toBe(img);

    const formatted = img.clone().toFormat('webp', { quality: 80 });
    expect(formatted).not.toBe(img);
  });

  it('should get metadata', async () => {
    const img = sharp(image.buffer);
    const metadata = await img.metadata();
    expect(metadata).toMatchObject({
      channels: 3,
      chromaSubsampling: '4:2:0',
      density: 72,
      depth: 'uchar',
      exif: expect.any(Buffer),
      format: 'jpeg',
      hasAlpha: false,
      hasProfile: false,
      isProgressive: false,
      orientation: 6,
      resolutionUnit: 'inch',
      size: 2539,
      space: 'srgb',
      width: 100,
      height: 75,
    });
  });

  it("should won't apply transform to the metadata", async () => {
    const img1 = sharp(image.buffer);
    expect(await img1.metadata()).toMatchObject({
      orientation: 6,
      width: 100,
      height: 75,
    });

    img1.rotate();
    // Won't apply transform to the metadata.
    expect(await img1.metadata()).toMatchObject({
      orientation: 6,
      width: 100,
      height: 75,
    });

    // After convert to buffer, the metadata will be applied.
    const img2 = sharp(await img1.toBuffer());
    const metadata2 = await img2.metadata();
    expect(metadata2).toMatchObject({
      width: 75,
      height: 100,
    });
    expect(metadata2.orientation).toBeUndefined();
  });

  const bound = { width: 50, height: 50 };
  const resizeCases: ResizeOptions[] = [
    { fit: 'cover', ...bound },
    { fit: 'contain', ...bound },
    { fit: 'fill', ...bound },
    { fit: 'inside', width: 38, height: 50 },
    { fit: 'outside', width: 50, height: 67 },
  ];

  /** @see https://sharp.pixelplumbing.com/api-resize */
  it.each(resizeCases)(
    'should resize image to ($width, $height) by $fit',
    async ({ fit, width, height }) => {
      const img = sharp(image.buffer);
      const resizedBuf = await img
        .rotate() // Apply orientation first
        .resize({ fit, ...bound })
        .toFormat('png')
        .toBuffer();
      const resized = sharp(resizedBuf);
      expect(await resized.metadata()).toMatchObject({ width, height });
    },
  );
});

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

describe.each(images)('Image $filename ($width, $height)', data => {
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
