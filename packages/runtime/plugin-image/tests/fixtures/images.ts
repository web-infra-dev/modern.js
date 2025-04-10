import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export interface FixtureImageData {
  basename: string;
  filename: string;
  filesize: number;
  buffer: Uint8Array;
  width: number;
  height: number;
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// TODO: Skip all the baseline JPEG images, they are not supported by image-size yet.
const _images = [
  // { basename: 'coast.jpg', width: 100, height: 75 },
  // { basename: 'fall.jpg', width: 100, height: 66 },
  { basename: 'firefox.png', width: 97, height: 100 },
  // { basename: 'mountain.jpg', width: 100, height: 58 },
  { basename: 'opera.png', width: 100, height: 100 },
  // { basename: 'street.jpg', width: 100, height: 75 },
  { basename: 'sunrise.jpg', width: 100, height: 75 },
  // { basename: 'sunset.jpg', width: 100, height: 75 },
] satisfies Partial<FixtureImageData>[];

export const images: FixtureImageData[] = _images.map(image => {
  const filename = path.join(__dirname, 'images', image.basename);
  const buffer = fs.readFileSync(filename);
  const filesize = buffer.length;
  return { ...image, filesize, buffer, filename };
});
