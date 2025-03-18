import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export interface FixtureImageData {
  filename: string;
  filesize: number;
  buffer: Uint8Array;
  width: number;
  height: number;
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// TODO: Skip all the baseline JPEG images, they are not supported by image-size yet.
const _images = [
  // { filename: 'coast.jpg', width: 100, height: 75 },
  // { filename: 'fall.jpg', width: 100, height: 66 },
  { filename: 'firefox.png', width: 97, height: 100 },
  // { filename: 'mountain.jpg', width: 100, height: 58 },
  { filename: 'opera.png', width: 100, height: 100 },
  // { filename: 'street.jpg', width: 100, height: 75 },
  { filename: 'sunrise.jpg', width: 100, height: 75 },
  // { filename: 'sunset.jpg', width: 100, height: 75 },
] satisfies Partial<FixtureImageData>[];

export const images: FixtureImageData[] = _images.map(image => {
  const buffer = fs.readFileSync(
    path.join(__dirname, 'images', image.filename),
  );
  const filesize = buffer.length;
  return { ...image, filesize, buffer };
});
