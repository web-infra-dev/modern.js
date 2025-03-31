import { describe, expect, it, vi } from 'vitest';
import {
  type ResolvedImageProps,
  resolveImageProps,
} from '../options/image-props';
import {
  resolveImageAttrs,
  resolveImageStyle,
  resolvePlaceholderStyle,
  resolveSizes,
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
      placeholder: 'data:image/svg+xml;base64,xyz',
    };
    const result = resolvePlaceholderStyle(props);
    expect(result).toMatchObject({
      backgroundImage: 'url("data:image/svg+xml;base64,xyz")',
    });
  });

  it('should throw error when placeholder is blur but no thumbnail provided', () => {
    expect(() =>
      resolvePlaceholderStyle(
        resolveImageProps({
          alt: 'test',
          src: 'test.jpg',
          placeholder: 'blur',
        }),
      ),
    ).toThrowError(/placeholder="blur"/);
    expect(() =>
      resolvePlaceholderStyle(
        resolveImageProps({
          alt: 'test',
          src: { url: 'test.jpg', width: 100, height: 100 },
          placeholder: 'blur',
        }),
      ),
    ).toThrowError(/placeholder="blur"/);
  });

  it('should throw error when placeholder is not a data URL', () => {
    expect(() =>
      resolvePlaceholderStyle(
        resolveImageProps({ alt: 'test', src: 'test.jpg', placeholder: 'foo' }),
      ),
    ).toThrowError(/must be a data URL/);
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
      { url: '/image?t=test.jpg&w=100&q=75', condition: '1x' },
      { url: '/image?t=test.jpg&w=200&q=75', condition: '2x' },
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
      { url: '/image?t=test.jpg&w=150&q=75', condition: '1.5x' },
      { url: '/image?t=test.jpg&w=300&q=75', condition: '3x' },
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
    expect(result).toEqual([
      { url: '/image?t=test.jpg&w=100&q=75', condition: '1x' },
    ]);
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
      { url: '/image?t=test.jpg&w=16&q=75', condition: '16w' },
      { url: '/image?t=test.jpg&w=32&q=75', condition: '32w' },
      { url: '/image?t=test.jpg&w=48&q=75', condition: '48w' },
      { url: '/image?t=test.jpg&w=64&q=75', condition: '64w' },
      { url: '/image?t=test.jpg&w=96&q=75', condition: '96w' },
      { url: '/image?t=test.jpg&w=128&q=75', condition: '128w' },
      { url: '/image?t=test.jpg&w=256&q=75', condition: '256w' },
      { url: '/image?t=test.jpg&w=384&q=75', condition: '384w' },
      { url: '/image?t=test.jpg&w=640&q=75', condition: '640w' },
      { url: '/image?t=test.jpg&w=750&q=75', condition: '750w' },
      { url: '/image?t=test.jpg&w=828&q=75', condition: '828w' },
      { url: '/image?t=test.jpg&w=1080&q=75', condition: '1080w' },
      { url: '/image?t=test.jpg&w=1200&q=75', condition: '1200w' },
      { url: '/image?t=test.jpg&w=1920&q=75', condition: '1920w' },
      { url: '/image?t=test.jpg&w=2048&q=75', condition: '2048w' },
      { url: '/image?t=test.jpg&w=3840&q=75', condition: '3840w' },
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
      { url: '/image?t=test.jpg&w=100&q=75', condition: '1x' },
      { url: '/image?t=test.jpg&w=200&q=75', condition: '2x' },
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
      src: '/image?t=test.jpg&w=200&q=75',
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

  it('should not generate srcSet & sizes when unoptimized', () => {
    const props: ResolvedImageProps = {
      ...defaultProps,
      loader: vi.fn(),
      src: 'test.jpg',
      width: 100,
      height: 100,
      unoptimized: true,
    };
    const result = resolveImageAttrs(props);
    expect(result.srcSet).toBeUndefined();
    expect(result.sizes).toBeUndefined();
    expect(result.src).toBe('test.jpg');
    expect(props.loader).not.toBeCalled();
  });
});

describe('resolveSizes', () => {
  it('should return sizes', () => {
    const props: ResolvedImageProps = {
      ...defaultProps,
      src: 'test.jpg',
      width: 100,
      height: 100,
      sizes: '(max-width: 768px) 100vw, 50vw',
    };
    const result = resolveSizes(props);
    expect(result).toBe('(max-width: 768px) 100vw, 50vw');
  });

  it('should return undefined when no width or sizes provided', () => {
    const props: ResolvedImageProps = {
      ...defaultProps,
      src: 'test.jpg',
      width: 100,
      height: 100,
    };
    const result = resolveSizes(props);
    expect(result).toBeUndefined();
  });
});
