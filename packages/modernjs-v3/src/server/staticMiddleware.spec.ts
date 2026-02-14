import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createStaticMiddleware } from './staticMiddleware';

// Mock dependencies
vi.mock('fs-extra', () => ({
  default: {
    pathExists: vi.fn(),
  },
}));

vi.mock('./fileCache', () => ({
  fileCache: {
    getFile: vi.fn(),
  },
}));

import fs from 'fs-extra';
import { fileCache } from './fileCache';

describe('staticMiddleware', () => {
  let middleware: any;
  let mockContext: any;
  let nextSpy: any;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Create middleware instance
    middleware = createStaticMiddleware({
      assetPrefix: '',
      pwd: '/test/path',
    });

    // Setup mock context
    nextSpy = vi.fn();
    mockContext = {
      req: {
        path: '',
      },
      header: vi.fn(),
      body: vi.fn(),
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
      (fs.pathExists as any).mockResolvedValue(false);

      await middleware(mockContext, nextSpy);

      // Should not return early due to extension check
      expect(fs.pathExists).toHaveBeenCalled();
    });
  });

  describe('asset prefix filtering', () => {
    it('should call next() for paths not starting with /bundles', async () => {
      mockContext.req.path = '/assets/test.js';

      await middleware(mockContext, nextSpy);

      expect(nextSpy).toHaveBeenCalledOnce();
      expect(fs.pathExists).not.toHaveBeenCalled();
      expect(mockContext.header).not.toHaveBeenCalled();
      expect(mockContext.body).not.toHaveBeenCalled();
    });

    it('should call next() for root path', async () => {
      mockContext.req.path = '/test.js';

      await middleware(mockContext, nextSpy);

      expect(nextSpy).toHaveBeenCalledOnce();
      expect(fs.pathExists).not.toHaveBeenCalled();
    });

    it('should process paths starting with /bundles', async () => {
      mockContext.req.path = '/bundles/test.js';
      (fs.pathExists as any).mockResolvedValue(false);

      await middleware(mockContext, nextSpy);

      // Should proceed to file existence check
      expect(fs.pathExists).toHaveBeenCalledWith('/test/path/bundles/test.js');
    });
  });

  describe('file existence check', () => {
    it('should call next() when file does not exist', async () => {
      mockContext.req.path = '/bundles/nonexistent.js';
      (fs.pathExists as any).mockResolvedValue(false);

      await middleware(mockContext, nextSpy);

      expect(fs.pathExists).toHaveBeenCalledWith(
        '/test/path/bundles/nonexistent.js',
      );
      expect(nextSpy).toHaveBeenCalledOnce();
      expect(fileCache.getFile).not.toHaveBeenCalled();
      expect(mockContext.header).not.toHaveBeenCalled();
      expect(mockContext.body).not.toHaveBeenCalled();
    });

    it('should proceed to file cache when file exists', async () => {
      mockContext.req.path = '/bundles/existing.js';
      (fs.pathExists as any).mockResolvedValue(true);
      (fileCache.getFile as any).mockResolvedValue(null);

      await middleware(mockContext, nextSpy);

      expect(fs.pathExists).toHaveBeenCalledWith(
        '/test/path/bundles/existing.js',
      );
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
      (fs.pathExists as any).mockResolvedValue(true);
      (fileCache.getFile as any).mockResolvedValue(mockFileResult);
      mockContext.body.mockReturnValue('response');

      const result = await middleware(mockContext, nextSpy);

      expect(fs.pathExists).toHaveBeenCalledWith('/test/path/bundles/app.js');
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
      (fs.pathExists as any).mockResolvedValue(true);
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
      (fs.pathExists as any).mockResolvedValue(true);
      (fileCache.getFile as any).mockResolvedValue(mockFileResult);

      await customMiddleware(mockContext, nextSpy);

      // Should remove prefix from path
      expect(fs.pathExists).toHaveBeenCalledWith('/test/path/bundles/test.js');
    });
  });
});
