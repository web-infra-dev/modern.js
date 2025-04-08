import type { ImageContext } from '@/types/image';
import { renderHook } from '@testing-library/react';
import { type PropsWithChildren, useContext } from 'react';
import { describe, expect, expectTypeOf, it, vi } from 'vitest';
import { ImageOptionsContext, ImageOptionsProvider } from './context';
import { resolveImageOptions } from './options';

function providerWrapper(options: ImageContext = {}) {
  return function Provider(props: PropsWithChildren) {
    return <ImageOptionsProvider value={options} {...props} />;
  };
}

describe('ImageOptionsContext', () => {
  it('should provide default image options', () => {
    const { result } = renderHook(() => useContext(ImageOptionsContext));
    expect(result.current).toEqual({ quality: 90 });
  });

  it('should inherit global options with ImageOptionsProvider', () => {
    const loader = vi.fn(() => 'foo');
    const { result } = renderHook(() => useContext(ImageOptionsContext), {
      wrapper: providerWrapper({ loader }),
    });
    expect(result.current).toEqual({ loader, quality: 90 });
  });

  it('should override default options with ImageOptionsProvider', () => {
    const { result } = renderHook(() => useContext(ImageOptionsContext), {
      wrapper: providerWrapper({ quality: 99 }),
    });
    expect(result.current).toEqual({ quality: 99 });
  });

  it('should return the resolved image component context with default values', () => {
    const context = resolveImageOptions({ src: '/foo.jpg' });
    expectTypeOf(context).toMatchTypeOf<ImageContext>();
    expect(context).toMatchObject({
      densities: [1, 2],
      placeholder: false,
    });
  });

  it('should override default values with provided options', () => {
    const context = resolveImageOptions({
      src: '/test.jpg',
      densities: [1, 2, 3],
      placeholder: 'blur',
    });
    expect(context).toMatchObject({
      densities: [1, 2, 3],
      placeholder: 'blur',
    });
  });

  it('should allow partial override of options', () => {
    const context = resolveImageOptions({
      src: '/test.jpg',
      unoptimized: true,
    });
    expect(context).toMatchObject({
      densities: [1, 2],
      placeholder: false,
      unoptimized: true,
    });
  });
});
