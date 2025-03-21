import type { CSSProperties } from 'react';
import type { ResolvedImageProps } from '../options/image-props';
import { getBlurImage } from './blur';
import { applyImageLoader } from './loader';
import { parseSizes, resolveResponsiveSizes } from './sizes';

export function resolveImageStyle(props: ResolvedImageProps): CSSProperties {
  const style = props.style ? { ...props.style } : {};
  const { width, height, thumbnail, fill, placeholder } = props;
  const { objectFit } = style;

  if (thumbnail) {
    style.color = 'transparent';
    style.backgroundSize = 'cover';
    style.backgroundPosition = '50% 50%';
    style.backgroundRepeat = 'no-repeat';
    if (placeholder === 'blur') {
      const blurred = getBlurImage({ thumbnail, width, height, objectFit });
      style.backgroundImage = `url(${blurred})`;
    }
  }
  if (placeholder !== 'blur' && typeof placeholder === 'string') {
    style.backgroundImage = `url(${placeholder})`;
  }

  if (fill) {
    // TODO: implement fill
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

  const style = resolveImageStyle(props);

  const srcSet = resolveSrcSet(props);
  if (srcSet.length > 0) {
    src = overrideSrc ?? srcSet.at(-1)!;
  }

  const fetchPriority = priority ? 'high' : undefined;

  return {
    src,
    alt,
    style,
    width,
    height,
    sizes,
    srcSet: srcSet.length > 0 ? srcSet.join(',') : undefined,
    loading,
    fetchPriority,
    // TODO: Add data-* attributes to tag component states.
  };
}
