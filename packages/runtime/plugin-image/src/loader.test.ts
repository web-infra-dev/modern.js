import type { Rspack } from '@rsbuild/core';
import { assert, beforeEach, describe, expect, it, vi } from 'vitest';
import { images } from '../tests/fixtures/images';
import loader from './loader';

type LoaderCallback = (
  err: Error | null | undefined,
  result: string | Buffer | undefined,
) => void;

const mockContext = {
  async: vi.fn(),
  importModule: vi.fn(),
  resource: '/path/to/image.jpg',
  request: 'some-request',
} as unknown as Rspack.LoaderContext;

// Add loader runner helper
async function executeLoader(content: Buffer | ArrayBuffer) {
  let resolveCallback: (args: Parameters<LoaderCallback>) => void;
  const promise = new Promise<Parameters<LoaderCallback>>(resolve => {
    resolveCallback = resolve;
  });

  const callback = vi.fn<LoaderCallback>((err, result) => {
    resolveCallback([err, result]);
  });
  vi.mocked(mockContext.async).mockReturnValue(callback);

  loader.call(mockContext, Buffer.from(content));
  return promise;
}

describe('image loader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock importModule to return asset path
    vi.mocked(mockContext.importModule).mockResolvedValue(
      '/assets/image.123456.jpg',
    );
  });

  it.each(images)(
    'should process $filename and generate thumbnail',
    async data => {
      const { buffer, width, height } = data;

      const [error, result] = await executeLoader(buffer);
      expect(error).toBeNull();

      // Verify module output content
      const moduleContent = result as string;
      expect(moduleContent).toMatch(/^export default /);

      const content = JSON.parse(moduleContent.replace('export default ', ''));
      expect(content).toMatchObject({
        src: '/assets/image.123456.jpg',
        width,
        height,
        thumbnail: {
          // TODO: use concrete value.
          width: expect.any(Number),
          height: expect.any(Number),
          src: expect.stringMatching(/^data:image\/jpeg;base64,/),
        },
      });
    },
  );

  it.each(images)(
    'should maintain aspect ratio of $filename in thumbnail',
    async data => {
      const { buffer, width, height } = data;

      const [, result] = await executeLoader(buffer);
      assert(typeof result === 'string');
      const content = JSON.parse(result.replace('export default ', ''));

      const aspectRatioOriginal = width / height;
      const aspectRatioThumbnail =
        content.thumbnail.width / content.thumbnail.height;

      expect(Math.abs(aspectRatioOriginal - aspectRatioThumbnail)).toBeLessThan(
        0.1,
      );
    },
  );

  it('should handle errors gracefully', async () => {
    vi.mocked(mockContext.importModule).mockRejectedValue(
      new Error('Import failed'),
    );

    const [error] = await executeLoader(Buffer.from('invalid image'));
    expect(error).toBeInstanceOf(Error);
  });
});
