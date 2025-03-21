import { describe, expect, expectTypeOf, it } from 'vitest';
import type { ImageProps } from '../../shared/options';
import { defaultLoader } from '../image/loader';
import { resolveImageProps } from './image-props';

describe('resolveImageProps', () => {
  it('should return the resolved image props with default values', () => {
    const props = resolveImageProps({ alt: 'Foo', src: '/foo.jpg' });
    expectTypeOf(props).toMatchTypeOf<ImageProps>();
    expect(props).toEqual({
      alt: 'Foo',
      densities: [1, 2],
      fill: false,
      height: undefined,
      loader: defaultLoader,
      loading: 'lazy',
      placeholder: false,
      priority: false,
      quality: 75,
      src: '/foo.jpg',
      width: undefined,
    });
  });
});
