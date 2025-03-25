import { type CSSProperties, use } from 'react';
import type { ResolvedImageProps } from '../options/image-props';
import { getBlurImage } from './blur';
import { applyImageLoader } from './loader';
import { parseSizes, resolveResponsiveSizes } from './sizes';

const INVALID_BACKGROUND_SIZE_VALUES: CSSProperties['objectFit'][] = [
  '-moz-initial',
  'fill',
  'none',
  'scale-down',
  undefined,
];

/**
 * This implementation is based on code from [Next.js](https://github.com/vercel/next.js/blob/ed10f7ed0246fcc763194197eb9beebcbd063162/packages/next/src/shared/lib/get-img-props.ts#L649-L691)
 * which is licensed under the MIT License.
 *
 * @param props
 * @returns
 */
export function resolvePlaceholderStyle(
  props: ResolvedImageProps,
): CSSProperties {
  const { width, height, placeholder, thumbnail = '' } = props;
  const style: CSSProperties = {};
  const objectFit = props.style?.objectFit;

  let backgroundImage: string | undefined;
  if (placeholder === 'blur') {
    backgroundImage = `url("data:image/svg+xml;charset=utf-8,${getBlurImage({ thumbnail, width, height, objectFit })}")`;
  } else if (typeof placeholder === 'string') {
    backgroundImage = `url("${placeholder}")`;
  }

  let backgroundSize: CSSProperties['backgroundSize'] = objectFit;
  if (INVALID_BACKGROUND_SIZE_VALUES.includes(objectFit)) {
    backgroundSize = objectFit === 'fill' ? '100% 100%' : 'cover';
  }

  if (backgroundImage) {
    Object.assign(style, {
      backgroundSize,
      backgroundPosition: props.style?.objectPosition || '50% 50%',
      backgroundRepeat: 'no-repeat',
      backgroundImage,
    });
  }

  if (process.env.NODE_ENV === 'development') {
    // TODO: Replacing placeholder with devServer url to improve dev experience.
  }

  return style;
}

export function resolveImageStyle(props: ResolvedImageProps): CSSProperties {
  const style: CSSProperties = {};
  const { fill } = props;

  if (fill) {
    throw new Error('fill is unsupported yet');
    // Object.assign(style, {
    //   position: 'absolute',
    //   height: '100%',
    //   width: '100%',
    //   left: 0,
    //   top: 0,
    //   right: 0,
    //   bottom: 0,
    //   color: 'transparent', // Hide `alt` text while image is loading
    // });
  }

  return style;
}

export function resolveSrcSet(options: ResolvedImageProps) {
  const { src, densities, width, sizes } = options;

  const srcSet: string[] = [];
  if (sizes) {
    const responsiveSizes = resolveResponsiveSizes(width, parseSizes(sizes));
    for (const responsiveWidth of responsiveSizes) {
      const url = applyImageLoader({ ...options, width: responsiveWidth });
      srcSet.push(`${url} ${responsiveWidth}w`);
    }
  } else if (width) {
    for (const density of densities) {
      const url = applyImageLoader({ ...options, width: width * density });
      srcSet.push(`${url} ${density}x`);
    }
  } else {
    srcSet.push(`${src} 1x`);
  }

  return srcSet;
}

export function resolveImageAttrs(
  props: ResolvedImageProps,
): React.ImgHTMLAttributes<HTMLImageElement> {
  let { src } = props;
  const { alt, width, height, sizes, overrideSrc, loading, priority } = props;

  const style = {
    ...props.style,
    ...resolveImageStyle(props),
    ...resolvePlaceholderStyle(props),
  };

  const srcSet = resolveSrcSet(props);
  if (srcSet.length > 0) {
    src = overrideSrc ?? srcSet.at(-1)!;
  }

  const attrs: React.ImgHTMLAttributes<HTMLImageElement> = {
    src,
    alt,
    style,
    width,
    height,
    sizes,
    srcSet: srcSet.length > 0 ? srcSet.join(',') : undefined,
    loading,
    // TODO: Add data-* attributes to tag component states.
  };

  const fetchPriority = priority ? 'high' : undefined;
  if (typeof use === 'function') {
    attrs.fetchPriority = fetchPriority;
  } else {
    // @ts-expect-error Compatibility with React 18.
    attrs.fetchpriority = fetchPriority;
  }

  return attrs;
}
