import { describe, expect, it } from 'vitest';
import type { ResolvedImageProps } from '../options/image-props';
import {
  resolveImageAttrs,
  resolveImageStyle,
  resolvePlaceholderStyle,
  resolveSrcSet,
} from './attrs';

const defaultProps = {
  alt: 'Test image',
  loader: ({ src, width, quality }) =>
    `/image?t=${src}&w=${width}&q=${quality}`,
  quality: 75,
  loading: 'lazy',
  densities: [1, 2],
  fill: false,
  priority: false,
  placeholder: false,
} as ResolvedImageProps;

describe('resolveImageStyle', () => {
  it('should resolve image style', () => {
    const result = resolveImageStyle({ ...defaultProps });
    expect(result).toMatchInlineSnapshot(`{}`);
  });

  it('should throw error when configured unsupported props', () => {
    expect(() =>
      resolveImageStyle({ ...defaultProps, fill: true }),
    ).toThrowError();
  });
});

describe('resolvePlaceholderStyle', () => {
  it('should apply thumbnail styles with blur placeholder', () => {
    const props: ResolvedImageProps = {
      ...defaultProps,
      src: 'test.jpg',
      width: 100,
      height: 100,
      thumbnail: {
        url: 'data:image/jpeg;base64,xyz',
        width: 10,
        height: 10,
      },
      placeholder: 'blur',
    };
    const result = resolvePlaceholderStyle(props);
    expect(result).toMatchObject({
      backgroundSize: 'cover',
      backgroundPosition: '50% 50%',
      backgroundRepeat: 'no-repeat',
      backgroundImage: expect.stringContaining('data:image/jpeg;base64,'),
    });
  });

  it('should apply custom placeholder', () => {
    const props: ResolvedImageProps = {
      ...defaultProps,
      src: 'https://example.com/test.jpg',
      width: 100,
      height: 100,
      placeholder: 'custom-placeholder.jpg',
    };
    const result = resolvePlaceholderStyle(props);
    expect(result).toMatchObject({
      backgroundImage: 'url("custom-placeholder.jpg")',
    });
  });
});

describe('resolveSrcSet', () => {
  it('should generate srcSet', () => {
    const props: ResolvedImageProps = {
      ...defaultProps,
      src: 'test.jpg',
      width: 100,
      height: 100,
    };
    const result = resolveSrcSet(props);
    expect(result).toEqual([
      '/image?t=test.jpg&w=100&q=75 1x',
      '/image?t=test.jpg&w=200&q=75 2x',
    ]);
  });

  it('should generate srcSet with different densities', () => {
    const props: ResolvedImageProps = {
      ...defaultProps,
      src: 'test.jpg',
      width: 100,
      height: 100,
      densities: [1.5, 3],
    };
    const result = resolveSrcSet(props);
    expect(result).toEqual([
      '/image?t=test.jpg&w=150&q=75 1.5x',
      '/image?t=test.jpg&w=300&q=75 3x',
    ]);
  });

  it('should generate srcSet with 1x only', () => {
    const props: ResolvedImageProps = {
      ...defaultProps,
      src: 'test.jpg',
      width: 100,
      height: 100,
      densities: [1],
    };
    const result = resolveSrcSet(props);
    expect(result).toEqual(['/image?t=test.jpg&w=100&q=75 1x']);
  });

  it('should generate srcSet with responsive sizes', () => {
    const props: ResolvedImageProps = {
      ...defaultProps,
      src: 'test.jpg',
      width: 1000,
      height: 1000,
      sizes: '(max-width: 768px) 100vw, 50vw',
    };
    const result = resolveSrcSet(props);
    expect(result).toEqual([
      '/image?t=test.jpg&w=384&q=75 384w',
      '/image?t=test.jpg&w=640&q=75 640w',
      '/image?t=test.jpg&w=750&q=75 750w',
      '/image?t=test.jpg&w=828&q=75 828w',
      '/image?t=test.jpg&w=1080&q=75 1080w',
      '/image?t=test.jpg&w=1200&q=75 1200w',
      '/image?t=test.jpg&w=1920&q=75 1920w',
      '/image?t=test.jpg&w=2048&q=75 2048w',
      '/image?t=test.jpg&w=3840&q=75 3840w',
    ]);
  });

  it('should return basic srcSet when no width or sizes provided', () => {
    const props: ResolvedImageProps = {
      ...defaultProps,
      src: 'test.jpg',
      width: 100,
      height: 100,
    };
    const result = resolveSrcSet(props);
    expect(result).toEqual([
      '/image?t=test.jpg&w=100&q=75 1x',
      '/image?t=test.jpg&w=200&q=75 2x',
    ]);
  });
});

describe('resolveImageAttrs', () => {
  it('should return basic image attributes', () => {
    const props: ResolvedImageProps = {
      ...defaultProps,
      src: 'test.jpg',
      width: 100,
      height: 100,
    };
    const result = resolveImageAttrs(props);
    expect(result).toMatchObject({
      src: '/image?t=test.jpg&w=200&q=75 2x',
      alt: 'Test image',
      width: 100,
      height: 100,
    });
  });

  it('should set high fetchPriority when priority is true', () => {
    const props: ResolvedImageProps = {
      ...defaultProps,
      src: 'test.jpg',
      width: 100,
      height: 100,
      priority: true,
    };
    const result = resolveImageAttrs(props);
    expect(result.fetchPriority).toBe('high');
  });

  it('should include srcSet and sizes when provided', () => {
    const props: ResolvedImageProps = {
      ...defaultProps,
      src: 'test.jpg',
      width: 100,
      height: 100,
      sizes: '100vw',
    };
    const result = resolveImageAttrs(props);
    expect(result.srcSet).toBeDefined();
    expect(result.sizes).toBe('100vw');
  });

  it('should apply overrideSrc to src', () => {
    const props: ResolvedImageProps = {
      ...defaultProps,
      src: 'test.jpg',
      width: 100,
      height: 100,
      overrideSrc: 'override.jpg',
    };
    const result = resolveImageAttrs(props);
    expect(result).toMatchObject({
      src: 'override.jpg',
      srcSet: '/image?t=test.jpg&w=100&q=75 1x,/image?t=test.jpg&w=200&q=75 2x',
      sizes: undefined,
    });
  });

  it('should preserve existing style properties', () => {
    const props: ResolvedImageProps = {
      ...defaultProps,
      src: 'test.jpg',
      width: 100,
      height: 100,
      placeholder: 'blur',
      thumbnail: {
        url: 'data:image/jpeg;base64,xyz',
        width: 10,
        height: 10,
      },
      style: { color: 'red', margin: '10px' },
    };
    const result = resolveImageAttrs(props);
    expect(result.style).toEqual({
      backgroundImage: expect.any(String),
      backgroundPosition: '50% 50%',
      backgroundRepeat: 'no-repeat',
      backgroundSize: 'cover',
      color: 'red',
      margin: '10px',
    });
  });
});
