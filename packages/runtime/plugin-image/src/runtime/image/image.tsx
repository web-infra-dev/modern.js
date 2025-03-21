import { type CSSProperties, forwardRef, useEffect, useState } from 'react';
import type { ImageProps } from '../../shared/options';
import type { Merge3 } from '../../types/utils';
import type { ResolvedImageComponentContext } from '../options/image-component-context';
import type { ResolvedImageOptions } from '../options/image-options';
import { useImage } from './hooks';

export const Image = forwardRef<HTMLImageElement, ImageProps>((props, ref) => {
  const resolveImage = useImage();

  const style: CSSProperties = {};
  if (thumbnail) {
    style.color = 'transparent';
    style.backgroundSize = 'cover';
    style.backgroundPosition = '50% 50%';
    style.backgroundRepeat = 'no-repeat';
    style.backgroundImage = `url(${thumbnail.url})`;
  }

  const [urls, setUrls] = useState<string[]>([]);
  const srcSet = urls
    .map((url, index) => `${url} ${densities[index]}x`)
    .join(',');

  useEffect(() => {
    Promise.all(
      densities.map(density =>
        loader({
          src,
          width: width && width * density,
          height: height && height * density,
          quality,
        }),
      ),
    ).then(setUrls);
  }, [loader, src, width, quality, densities, height]);

  return (
    <img
      ref={ref}
      srcSet={srcSet}
      width={width}
      height={height}
      alt={alt}
      src
      style={style}
    />
  );
});
