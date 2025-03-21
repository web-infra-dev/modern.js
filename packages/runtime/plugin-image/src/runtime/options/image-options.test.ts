import { describe, expect, expectTypeOf, it } from 'vitest';
import type { ImageOptions } from '../../shared/options';
import { resolveImageOptions } from './image-options';

describe('resolveImageOptions', () => {
  it('should return the resolved image props', () => {
    const props = resolveImageOptions({ src: '/foo.jpg' });
    expectTypeOf(props).toMatchTypeOf<ImageOptions>();
    expect(props).toMatchInlineSnapshot(`
      {
        "height": undefined,
        "loader": [Function],
        "quality": 75,
        "src": "/foo.jpg",
        "width": undefined,
      }
    `);
  });

  it('should throw if args is invalid', () => {
    expect(() => resolveImageOptions(undefined as any)).toThrow();
    expect(() => resolveImageOptions({} as any)).toThrow();
  });

  it('should resolve width & height with ImageResource src', () => {
    const props = resolveImageOptions({
      src: {
        url: '/foo.jpg',
        height: 100,
        width: 75,
      },
    });
    expect(props).toMatchObject({ height: 100, width: 75 });
  });

  it('should resolve width & height from explicit props', () => {
    const props1 = resolveImageOptions({
      src: {
        url: '/foo.jpg',
        height: 100,
        width: 75,
      },
      height: 150,
      width: 80,
    });
    expect(props1).toMatchObject({ height: 150, width: 80 });

    const props2 = resolveImageOptions({
      src: '/foo.jpg',
      height: 150,
      width: 80,
    });
    expect(props2).toMatchObject({ height: 150, width: 80 });
  });

  it('should resolve one of width & height from explicit props', () => {
    const props1 = resolveImageOptions({
      src: '/foo.jpg',
      height: 150,
    });
    expect(props1).toMatchObject({ height: 150 });

    const props2 = resolveImageOptions({
      src: '/foo.jpg',
      width: 150,
    });
    expect(props2).toMatchObject({ width: 150 });
  });

  it('should resolve width & height by aspect ratio', () => {
    const props1 = resolveImageOptions({
      src: { url: '/foo.jpg', width: 75, height: 100 },
      height: 150,
    });
    expect(props1).toMatchObject({ width: 112.5, height: 150 });

    const props2 = resolveImageOptions({
      src: { url: '/foo.jpg', width: 75, height: 100 },
      width: 150,
    });
    expect(props2).toMatchObject({ width: 150, height: 200 });
  });
});
