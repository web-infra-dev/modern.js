import { imageSize } from 'image-size';
import type { ISizeCalculationResult } from 'image-size/types/interface';
import pMemoize from 'p-memoize';
import type {
  AvailableFormatInfo,
  AvifOptions,
  FormatEnum,
  GifOptions,
  HeifOptions,
  Jp2Options,
  JpegOptions,
  JxlOptions,
  OutputOptions,
  PngOptions,
  ResizeOptions,
  Sharp,
  TiffOptions,
  WebpOptions,
} from 'sharp';
import { logger } from './logger';
import type { ImageSize } from './types/image';

export const loadSharp = pMemoize(async () => {
  logger.debug('Intend to load sharp package in first time');
  const exports = await import('sharp');
  logger.debug('Successfully loaded sharp package');
  return { ...exports, sharp: exports.default };
});

/**
 * @param type - The type of the image.
 * @param orientation - The orientation of the image.
 *   1. Normal orientation
 *   2. Flipped horizontally
 *   3. Rotated 180 degrees
 *   4. Flipped vertically
 *   5. Rotated 90 degrees clockwise and flipped horizontally
 *   6. Rotated 90 degrees clockwise
 *   7. Rotated 90 degrees clockwise and flipped vertically
 *   8. Rotated 90 degrees counterclockwise
 * @returns Whether the image is rotated.
 */
export function isRotatedOrientation(type: string, orientation?: number) {
  if (!orientation) return false;
  if (!['jpeg', 'jpg'].includes(type))
    throw new Error('Unsupported image type');
  return [5, 6, 7, 8].includes(orientation);
}

export class Image {
  public _debugName?: string;

  private constructor(
    private buffer: Uint8Array,
    private sharp: Sharp,
  ) {}

  static async create(buf: Uint8Array) {
    logger.debug('Intend to create a new image instance');
    const { sharp } = await loadSharp();
    return new Image(buf, sharp(buf));
  }

  private _size?: ImageSize;

  size() {
    if (!this._size) {
      const { width, height } = imageSize(this.buffer);
      this._size = { width, height };
    }
    const { width, height } = this._size;
    return { width, height };
  }

  resize(options: ResizeOptions) {
    const { width, height } = options;
    this._size ||= { ...this.size() };
    width && (this._size.width = width);
    height && (this._size.height = height);
    return this.sharp.resize(options);
  }

  thumbnail(options: ResizeOptions) {}

  format(
    format: keyof FormatEnum,
    options?:
      | OutputOptions
      | JpegOptions
      | PngOptions
      | WebpOptions
      | AvifOptions
      | HeifOptions
      | JxlOptions
      | GifOptions
      | Jp2Options
      | TiffOptions,
  ) {
    return this.sharp.toFormat(format, options);
  }

  clone() {
    return new Image(this.buffer, this.sharp.clone());
  }
}
