import { renderHook } from '@testing-library/react';
import { type PropsWithChildren, useContext } from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { ImageContext } from '../../shared/options';
import { ImageOptionsContext, ImageOptionsProvider } from './context';

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
    expect(result.current).toEqual({
      loader,
      quality: 90,
    });
  });

  it('should override default options with ImageOptionsProvider', () => {
    const { result } = renderHook(() => useContext(ImageOptionsContext), {
      wrapper: providerWrapper({ quality: 99 }),
    });
    expect(result.current).toEqual({ quality: 99 });
  });
});
