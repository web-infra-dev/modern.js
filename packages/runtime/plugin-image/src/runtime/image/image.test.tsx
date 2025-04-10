import { render } from '@testing-library/react';
import type React from 'react';
import { assert, beforeAll, describe, expect, it, vi } from 'vitest';
import { type DebuggableImageProps, Image } from './image';

const DebuggableImage = Image as unknown as React.FC<DebuggableImageProps>;

describe('<Image />', () => {
  it('should trigger onLoad event', async () => {
    let ref: HTMLImageElement | undefined;
    const onLoad = vi.fn();
    render(
      <Image
        ref={el => {
          el && (ref = el);
        }}
        src="/sunrise.jpg"
        alt="sunrise"
        onLoad={onLoad}
      />,
    );

    assert(ref);
    ref.dispatchEvent(new Event('load'));
    await vi.waitFor(() => {
      expect(onLoad).toHaveBeenCalled();
    });
  });

  it('should trigger onLoad event when image loaded before the component is mounted', async () => {
    const onLoad = vi.fn();

    render(
      <DebuggableImage
        src="/sunrise.jpg"
        alt="sunrise"
        onLoad={onLoad}
        beforeRef={img => {
          img &&
            Object.defineProperty(img, 'complete', {
              value: true,
              writable: false,
            });
        }}
      />,
    );

    await vi.waitFor(() => {
      expect(onLoad).toHaveBeenCalled();
    });
  });
});
