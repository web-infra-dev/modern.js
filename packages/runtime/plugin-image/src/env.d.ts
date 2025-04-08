/// <reference path="./global.d.ts" />
import type { ImageContext } from './shared/options';

declare global {
  var __INTERNAL_MODERNJS_IMAGE_OPTIONS__: ImageContext | undefined;
  var IS_TEST: boolean;
}
