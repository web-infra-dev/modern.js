import { it, expect, describe, rs, beforeEach } from '@rstest/core';
import { createStaticMiddleware } from './staticMiddleware';

// Mock dependencies
rs.mock('fs/promises', () => ({
  access: rs.fn(),
}));

rs.mock('./fileCache', () => ({
  fileCache: {
    getFile: rs.fn(),
  },
}));

import { access } from 'fs/promises';
import { fileCache } from './fileCache';

describe('staticMiddleware', () => {
  let middleware: any;
  let mockContext: any;
  let nextSpy: any;

  beforeEach(() => {
    // Reset all mocks
    rs.clearAllMocks();

    // Create middleware instance
    middleware = createStaticMiddleware({
      assetPrefix: '',
      pwd: '/test/path',
    });

    // Setup mock context
    nextSpy = rs.fn();
    mockContext = {
      req: {
        path: '',
      },
      header: rs.fn(),
      body: rs.fn(),
    };
  });

  describe('file extension filtering', () => {
    it('should call next() for non-js files', async () => {
      mockContext.req.path = '/bundles/test.css';

      await middleware(mockContext, nextSpy);

      expect(nextSpy).toHaveBeenCalledOnce();
      expect(mockContext.header).not.toHaveBeenCalled();
      expect(mockContext.body).not.toHaveBeenCalled();
    });

    it('should call next() for files without extension', async () => {
      mockContext.req.path = '/bundles/test';

      await middleware(mockContext, nextSpy);

      expect(nextSpy).toHaveBeenCalledOnce();
      expect(mockContext.header).not.toHaveBeenCalled();
      expect(mockContext.body).not.toHaveBeenCalled();
    });

    it('should process .js files', async () => {
      mockContext.req.path = '/bundles/test.js';
      (access as any).mockRejectedValue(new Error('ENOENT'));

      await middleware(mockContext, nextSpy);

      // Should not return early due to extension check
      expect(access).toHaveBeenCalled();
    });
  });

  describe('asset prefix filtering', () => {
    it('should call next() for paths not starting with /bundles', async () => {
      mockContext.req.path = '/assets/test.js';

      await middleware(mockContext, nextSpy);

      expect(nextSpy).toHaveBeenCalledOnce();
      expect(access).not.toHaveBeenCalled();
      expect(mockContext.header).not.toHaveBeenCalled();
      expect(mockContext.body).not.toHaveBeenCalled();
    });

    it('should call next() for root path', async () => {
      mockContext.req.path = '/test.js';

      await middleware(mockContext, nextSpy);

      expect(nextSpy).toHaveBeenCalledOnce();
      expect(access).not.toHaveBeenCalled();
    });

    it('should process paths starting with /bundles', async () => {
      mockContext.req.path = '/bundles/test.js';
      (access as any).mockRejectedValue(new Error('ENOENT'));

      await middleware(mockContext, nextSpy);

      // Should proceed to file existence check
      expect(access).toHaveBeenCalledWith('/test/path/bundles/test.js');
    });
  });

  describe('file existence check', () => {
    it('should call next() when file does not exist', async () => {
      mockContext.req.path = '/bundles/nonexistent.js';
      (access as any).mockRejectedValue(new Error('ENOENT'));

      await middleware(mockContext, nextSpy);

      expect(access).toHaveBeenCalledWith('/test/path/bundles/nonexistent.js');
      expect(nextSpy).toHaveBeenCalledOnce();
      expect(fileCache.getFile).not.toHaveBeenCalled();
      expect(mockContext.header).not.toHaveBeenCalled();
      expect(mockContext.body).not.toHaveBeenCalled();
    });

    it('should proceed to file cache when file exists', async () => {
      mockContext.req.path = '/bundles/existing.js';
      (access as any).mockResolvedValue(undefined);
      (fileCache.getFile as any).mockResolvedValue(null);

      await middleware(mockContext, nextSpy);

      expect(access).toHaveBeenCalledWith('/test/path/bundles/existing.js');
      expect(fileCache.getFile).toHaveBeenCalledWith(
        '/test/path/bundles/existing.js',
      );
    });
  });

  describe('successful file serving', () => {
    it('should serve file content with correct headers', async () => {
      const mockFileContent = 'console.log("test");';
      const mockFileResult = {
        content: mockFileContent,
        lastModified: Date.now(),
      };

      mockContext.req.path = '/bundles/app.js';
      (access as any).mockResolvedValue(undefined);
      (fileCache.getFile as any).mockResolvedValue(mockFileResult);
      mockContext.body.mockReturnValue('response');

      const result = await middleware(mockContext, nextSpy);

      expect(access).toHaveBeenCalledWith('/test/path/bundles/app.js');
      expect(fileCache.getFile).toHaveBeenCalledWith(
        '/test/path/bundles/app.js',
      );
      expect(nextSpy).not.toHaveBeenCalled();

      // Check headers
      expect(mockContext.header).toHaveBeenCalledWith(
        'Content-Type',
        'application/javascript',
      );
      expect(mockContext.header).toHaveBeenCalledWith(
        'Content-Length',
        String(mockFileResult.content.length),
      );

      // Check response
      expect(mockContext.body).toHaveBeenCalledWith(
        mockFileResult.content,
        200,
      );
      expect(result).toBe('response');
    });

    it('should handle empty file content', async () => {
      const mockFileResult = {
        content: '',
        lastModified: Date.now(),
      };

      mockContext.req.path = '/bundles/empty.js';
      (access as any).mockResolvedValue(undefined);
      (fileCache.getFile as any).mockResolvedValue(mockFileResult);
      mockContext.body.mockReturnValue('empty-response');

      const result = await middleware(mockContext, nextSpy);

      expect(mockContext.header).toHaveBeenCalledWith('Content-Length', '0');
      expect(mockContext.body).toHaveBeenCalledWith(
        mockFileResult.content,
        200,
      );
      expect(result).toBe('empty-response');
      expect(nextSpy).not.toHaveBeenCalled();
    });
  });

  describe('asset prefix handling', () => {
    it('should handle custom asset prefix correctly', async () => {
      const customMiddleware = createStaticMiddleware({
        assetPrefix: '/custom-prefix',
        pwd: '/test/path',
      });

      mockContext.req.path = '/bundles/test.js';
      await customMiddleware(mockContext, nextSpy);

      expect(nextSpy).toHaveBeenCalledOnce();
      expect(mockContext.header).not.toHaveBeenCalled();
      expect(mockContext.body).not.toHaveBeenCalled();
    });

    it('should handle asset prefix removal correctly', async () => {
      const customMiddleware = createStaticMiddleware({
        assetPrefix: '/prefix',
        pwd: '/test/path',
      });

      const mockFileResult = {
        content: 'test content',
        lastModified: Date.now(),
      };

      mockContext.req.path = '/prefix/bundles/test.js';
      (access as any).mockResolvedValue(undefined);
      (fileCache.getFile as any).mockResolvedValue(mockFileResult);

      await customMiddleware(mockContext, nextSpy);

      // Should remove prefix from path
      expect(access).toHaveBeenCalledWith('/test/path/bundles/test.js');
    });
  });
  it('does not serve paths outside the bundles directory or lookalike prefixes', async () => {
    for (const pathname of [
      '/bundles-other/remote.js',
      '/bundles/../secret.js',
    ]) {
      mockContext.req.path = pathname;
      await middleware(mockContext, nextSpy);
    }
    expect(nextSpy).toHaveBeenCalledTimes(2);
    expect(access).not.toHaveBeenCalled();
  });

  it('sets Content-Length using UTF-8 bytes', async () => {
    mockContext.req.path = '/bundles/remote.js';
    rs.mocked(access).mockResolvedValue(undefined);
    const content = '天气🌤';
    rs.mocked(fileCache.getFile).mockResolvedValue({
      content,
      lastModified: 1,
    });
    await middleware(mockContext, nextSpy);
    expect(mockContext.header).toHaveBeenCalledWith(
      'Content-Length',
      String(Buffer.byteLength(content)),
    );
    expect(mockContext.body).toHaveBeenCalledWith(content, 200);
  });
});
