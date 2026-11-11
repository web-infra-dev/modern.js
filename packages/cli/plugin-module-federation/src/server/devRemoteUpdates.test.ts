import { describe, expect, it, rs } from '@rstest/core';
import { startDevRemoteUpdates } from './devRemoteUpdates';

function deferred<T = void>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(value => {
    resolve = value;
  });
  return { promise, resolve };
}

describe('development remote manifest watcher', () => {
  it('does not reload when revalidation finds the target already applied', async () => {
    const reload = rs.fn();
    const watcher = startDevRemoteUpdates({
      remotes: ['weather'],
      shouldUpdateRemote: async () => true,
      updateRemotes: async () => ({ changed: false }),
      onReload: reload,
      onError: error => {
        throw error;
      },
    });
    await watcher.check();
    expect(reload).not.toHaveBeenCalled();
    await watcher.close();
  });

  it('reloads only after publication and coalesces checks while an update is running', async () => {
    const applied = deferred();
    const entered = deferred();
    let changed = true;
    const reload = rs.fn();
    const update = rs.fn(async () => {
      entered.resolve();
      await applied.promise;
      changed = false;
    });
    const watcher = startDevRemoteUpdates({
      remotes: ['weather'],
      shouldUpdateRemote: async () => changed,
      updateRemotes: update,
      onReload: reload,
      onError: error => {
        throw error;
      },
    });
    await entered.promise;
    const checks = [watcher.check(), watcher.check()];
    expect(reload).not.toHaveBeenCalled();
    applied.resolve();
    await Promise.all(checks);
    expect(update).toHaveBeenCalledTimes(1);
    expect(reload).toHaveBeenCalledTimes(1);
    await watcher.close();
  });

  it('keeps independent remotes updating when another manifest cannot be checked', async () => {
    const update = rs.fn(async () => {});
    const error = rs.fn();
    const watcher = startDevRemoteUpdates({
      remotes: ['unavailable', 'weather'],
      shouldUpdateRemote: async name => {
        if (name === 'unavailable') throw Error('offline');
        return true;
      },
      updateRemotes: update,
      onReload: rs.fn(),
      onError: error,
    });
    await watcher.check();
    expect(update).toHaveBeenCalledWith(['weather']);
    expect(error).toHaveBeenCalled();
    await watcher.close();
  });

  it('cancels manifest I/O on close and never reloads after closing', async () => {
    const started = deferred();
    const reload = rs.fn();
    const update = rs.fn(async () => {});
    const errors = rs.fn();
    const watcher = startDevRemoteUpdates({
      remotes: ['weather'],
      shouldUpdateRemote: async (_, { signal }) => {
        started.resolve();
        await new Promise<void>((_, reject) => {
          signal.addEventListener('abort', () => reject(signal.reason), {
            once: true,
          });
        });
        return true;
      },
      updateRemotes: update,
      onReload: reload,
      onError: errors,
    });
    await started.promise;
    await watcher.close();
    await watcher.check();
    expect(update).not.toHaveBeenCalled();
    expect(reload).not.toHaveBeenCalled();
    expect(errors).not.toHaveBeenCalled();
  });

  it('reports a failed publication without sending a success reload', async () => {
    const errors = rs.fn();
    const reload = rs.fn();
    const watcher = startDevRemoteUpdates({
      remotes: ['weather'],
      shouldUpdateRemote: async () => true,
      updateRemotes: async () => {
        throw Error('failed rebuild');
      },
      onReload: reload,
      onError: errors,
    });
    await watcher.check();
    expect(errors).toHaveBeenCalled();
    expect(reload).not.toHaveBeenCalled();
    await watcher.close();
  });
});
