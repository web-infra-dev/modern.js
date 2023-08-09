/**
 * @license
 * Copyright 2018 Google Inc.
 * https://github.com/vuejs/preload-webpack-plugin/blob/master/src/lib/determine-as-value.js
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import path from 'path';
import { URL } from 'url';
import { As } from './type';

export function determineAsValue({
  href,
  file,
}: {
  href: string;
  file: string;
}): As {
  // If `as` value is not provided in option, dynamically determine the correct
  // value based on the suffix of filename.

  // We only care about the pathname, so just use any domain when constructing the URL.
  // Use file instead of href option because the publicPath part may be malformed.
  // See https://github.com/vuejs/vue-cli/issues/5672
  const url = new URL(file || href, 'https://example.com');
  const extension = path.extname(url.pathname);

  if (['.css'].includes(extension)) {
    return 'style';
  }

  if (
    [
      '.png',
      '.jpg',
      '.jpeg',
      '.jfif',
      '.pjpeg',
      '.pjp',
      '.svg',
      '.webp',
      '.bmp',
      '.apng',
      '.avif',
      '.gif',
      '.ico',
      '.cur',
      '.tif',
      '.tiff',
    ].includes(extension)
  ) {
    return 'image';
  }

  if (['.mp4', '.ogg', '.webm'].includes(extension)) {
    return 'video';
  }

  if (['.mp3', '.wav'].includes(extension)) {
    return 'audio';
  }

  if (['.woff2', '.otf', '.ttf', '.woff', '.eot'].includes(extension)) {
    return 'font';
  }

  if (['.vtt'].includes(extension)) {
    return 'track';
  }

  return 'script';
}
