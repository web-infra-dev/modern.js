import {
  closeServer,
  getServer,
  setServer,
} from '../../src/utils/createServer';

describe('createServer utils', () => {
  it('waits for server close and shares an in-flight close', async () => {
    let finishClose: (() => void) | undefined;
    const server = {
      close: rstest.fn((callback: () => void) => {
        finishClose = callback;
      }),
    };

    setServer(server as never);

    const firstClose = closeServer();
    const secondClose = closeServer();
    let closed = false;
    firstClose.then(() => {
      closed = true;
    });

    await Promise.resolve();
    expect(closed).toBe(false);
    expect(getServer()).toBeNull();
    expect(server.close).toHaveBeenCalledTimes(1);

    finishClose?.();
    await Promise.all([firstClose, secondClose]);
    expect(closed).toBe(true);

    await closeServer();
    expect(server.close).toHaveBeenCalledTimes(1);
  });

  it('rejects when the Node server reports a close error', async () => {
    const closeError = new Error('server is not running');
    const server = {
      close: rstest.fn((callback: (error?: Error) => void) => {
        callback(closeError);
      }),
    };

    setServer(server as never);

    await expect(closeServer()).rejects.toBe(closeError);
    expect(getServer()).toBeNull();
    await expect(closeServer()).resolves.toBeUndefined();
  });
});
