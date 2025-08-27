import path from 'path';
import serverHmrPlugin from '../src/plugins/serverHmr';

describe('serverHmrPlugin', () => {
  let mockReload: jest.Mock;
  let mockApi: any;
  let plugin: any;

  beforeEach(() => {
    mockReload = jest.fn().mockResolvedValue(undefined);
    mockApi = {
      onReset: jest.fn(),
      getServerContext: jest.fn().mockReturnValue({
        appDirectory: '/mock/app/directory',
      }),
    };
    plugin = serverHmrPlugin(mockReload);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('plugin setup', () => {
    it('should register onReset handler correctly', () => {
      expect(plugin.name).toBe('@modern-js/server-hmr-plugin');
      expect(typeof plugin.setup).toBe('function');

      plugin.setup(mockApi);

      expect(mockApi.onReset).toHaveBeenCalledTimes(1);
      expect(typeof mockApi.onReset.mock.calls[0][0]).toBe('function');
    });
  });

  describe('file change handling', () => {
    let onResetHandler: any;

    beforeEach(() => {
      plugin.setup(mockApi);
      onResetHandler = mockApi.onReset.mock.calls[0][0];
    });

    it('should call reload when server files change except index', async () => {
      const event = {
        type: 'file-change',
        payload: [
          { filename: path.normalize('/mock/app/directory/server/api.js') },
          { filename: path.normalize('/mock/app/directory/server/utils.ts') },
        ],
      };

      await onResetHandler({ event });

      expect(mockReload).toHaveBeenCalledTimes(1);
    });

    it('should not call reload when server index file changes', async () => {
      const event = {
        type: 'file-change',
        payload: [
          { filename: path.normalize('/mock/app/directory/server/index.js') },
          { filename: path.normalize('/mock/app/directory/server/index.ts') },
        ],
      };

      await onResetHandler({ event });

      expect(mockReload).not.toHaveBeenCalled();
    });

    it('should not call reload when non-server files change', async () => {
      const event = {
        type: 'file-change',
        payload: [
          { filename: path.normalize('/mock/app/directory/src/App.js') },
          { filename: path.normalize('/mock/app/directory/public/index.html') },
        ],
      };

      await onResetHandler({ event });

      expect(mockReload).not.toHaveBeenCalled();
    });

    it('should not call reload when event type is not file-change', async () => {
      const event = {
        type: 'other-event',
        payload: [
          { filename: path.normalize('/mock/app/directory/server/api.js') },
        ],
      };

      await onResetHandler({ event });

      expect(mockReload).not.toHaveBeenCalled();
    });

    it('should handle mixed file changes correctly', async () => {
      const event = {
        type: 'file-change',
        payload: [
          { filename: path.normalize('/mock/app/directory/server/api.js') }, // should trigger reload
          { filename: path.normalize('/mock/app/directory/server/index.js') }, // should not trigger reload
          { filename: path.normalize('/mock/app/directory/src/App.js') }, // should not trigger reload
        ],
      };

      await onResetHandler({ event });

      expect(mockReload).toHaveBeenCalledTimes(1);
    });

    it('should handle empty payload correctly', async () => {
      const event = {
        type: 'file-change',
        payload: [],
      };

      await onResetHandler({ event });

      expect(mockReload).not.toHaveBeenCalled();
    });

    it('should handle server subdirectories correctly', async () => {
      const event = {
        type: 'file-change',
        payload: [
          {
            filename: path.normalize(
              '/mock/app/directory/server/middleware/auth.js',
            ),
          },
          {
            filename: path.normalize(
              '/mock/app/directory/server/routes/users.ts',
            ),
          },
        ],
      };

      await onResetHandler({ event });

      expect(mockReload).toHaveBeenCalledTimes(1);
    });

    it('should handle windows style paths correctly', async () => {
      mockApi.getServerContext.mockReturnValue({
        appDirectory: 'C:\\mock\\app\\directory',
      });

      const event = {
        type: 'file-change',
        payload: [{ filename: 'C:\\mock\\app\\directory\\server\\api.js' }],
      };

      const originalJoin = path.join;
      path.join = jest.fn().mockImplementation((...args) => {
        return originalJoin(...args).replace(/\//g, '\\');
      });

      await onResetHandler({ event });

      expect(mockReload).toHaveBeenCalledTimes(1);

      path.join = originalJoin;
      mockApi.getServerContext.mockReturnValue({
        appDirectory: '/mock/app/directory',
      });
    });
  });

  describe('error handling', () => {
    let onResetHandler: any;

    beforeEach(() => {
      plugin.setup(mockApi);
      onResetHandler = mockApi.onReset.mock.calls[0][0];
    });

    it('should propagate errors from reload function', async () => {
      const testError = new Error('Test reload error');
      mockReload.mockRejectedValue(testError);

      const event = {
        type: 'file-change',
        payload: [
          { filename: path.normalize('/mock/app/directory/server/api.js') },
        ],
      };

      await expect(onResetHandler({ event })).rejects.toThrow(
        'Test reload error',
      );
    });

    it('should handle getServerContext errors', async () => {
      mockApi.getServerContext.mockImplementation(() => {
        throw new Error('Context error');
      });

      const event = {
        type: 'file-change',
        payload: [
          { filename: path.normalize('/mock/app/directory/server/api.js') },
        ],
      };

      await expect(onResetHandler({ event })).rejects.toThrow('Context error');
    });
  });
});
