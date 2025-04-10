import type { ImageResource } from '../../types/image';

/**
 * This implementation is based on code from [Next.js](https://github.com/vercel/next.js/blob/ed10f7ed0246fcc763194197eb9beebcbd063162/packages/next/src/shared/lib/image-blur-svg.ts#L1-L34)
 * which is licensed under the MIT License.
 *
 * @param param0
 * @returns
 */
export function getBlurImage({
  width,
  height,
  thumbnail,
  objectFit,
}: {
  width?: number;
  height?: number;
  thumbnail: string | ImageResource;
  objectFit?: string;
}): string {
  const std = 20;
  let thumbnailWidth: number | undefined;
  let thumbnailHeight: number | undefined;
  let thumbnailUrl: string | undefined;
  if (typeof thumbnail === 'object') {
    thumbnailWidth = thumbnail.width;
    thumbnailHeight = thumbnail.height;
    thumbnailUrl = thumbnail.url;
  }
  const svgWidth = thumbnailWidth ? thumbnailWidth * 40 : width;
  const svgHeight = thumbnailHeight ? thumbnailHeight * 40 : height;

  const viewBox =
    svgWidth && svgHeight ? `viewBox='0 0 ${svgWidth} ${svgHeight}'` : '';
  const preserveAspectRatio = viewBox
    ? 'none'
    : objectFit === 'contain'
      ? 'xMidYMid'
      : objectFit === 'cover'
        ? 'xMidYMid slice'
        : 'none';

  return `%3Csvg xmlns='http://www.w3.org/2000/svg' ${viewBox}%3E%3Cfilter id='b' color-interpolation-filters='sRGB'%3E%3CfeGaussianBlur stdDeviation='${std}'/%3E%3CfeColorMatrix values='1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 100 -1' result='s'/%3E%3CfeFlood x='0' y='0' width='100%25' height='100%25'/%3E%3CfeComposite operator='out' in='s'/%3E%3CfeComposite in2='SourceGraphic'/%3E%3CfeGaussianBlur stdDeviation='${std}'/%3E%3C/filter%3E%3Cimage width='100%25' height='100%25' x='0' y='0' preserveAspectRatio='${preserveAspectRatio}' style='filter: url(%23b);' href='${thumbnailUrl}'/%3E%3C/svg%3E`;
}
