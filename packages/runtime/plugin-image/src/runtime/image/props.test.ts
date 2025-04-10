import type { ImageProps } from '@/types/image';
import { describe, expect, expectTypeOf, it } from 'vitest';
import { ipxImageLoader } from './loader';
import { resolveImageProps } from './props';

describe('resolveImageProps', () => {
  it('should return the resolved image props with default values', () => {
    const props = resolveImageProps({ src: '/foo.jpg' });
    expectTypeOf(props).toMatchTypeOf<ImageProps>();
    expect(props).toEqual({
      densities: [1, 2],
      fill: false,
      height: undefined,
      loader: ipxImageLoader,
      loading: 'lazy',
      onError: undefined,
      onLoad: undefined,
      placeholder: false,
      priority: false,
      quality: 75,
      src: '/foo.jpg',
      unoptimized: false,
      width: undefined,
    });
  });

  it('should override default values with provided options', () => {
    const props1 = resolveImageProps({
      alt: 'Foo',
      src: '/foo.jpg',
      priority: true,
    });
    expect(props1).toMatchObject({ priority: true });

    const props2 = resolveImageProps({
      alt: 'Foo',
      src: '/foo.jpg',
      loading: 'eager',
    });
    expect(props2).toMatchObject({ loading: 'eager' });

    expect(() => {
      resolveImageProps({
        alt: 'Foo',
        src: '/foo.jpg',
        loading: 'lazy',
        priority: true,
      });
    }).toThrowError(
      'Can\'t use priority={true} and loading="lazy" at the same time, please only use one of them.',
    );
  });
});
