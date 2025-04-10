/// <reference path="./global.d.ts" />
import type { ImageSerializableContext } from '@/types/image';

declare global {
  var __INTERNAL_MODERNJS_IMAGE_OPTIONS__: ImageSerializableContext | undefined;
  var __INTERNAL_MODERNJS_IMAGE_BASENAME__: string | undefined;
  var IS_TEST: boolean;
}
