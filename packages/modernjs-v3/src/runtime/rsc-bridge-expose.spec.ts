import { afterEach, describe, expect, it, vi } from 'vitest';

type ManifestLike = {
  serverManifest?: Record<string, unknown>;
  clientManifest?: Record<string, unknown>;
  serverConsumerModuleMap?: Record<string, unknown>;
};

type ExposeModuleMap = Record<string, () => Promise<unknown> | unknown>;

type WebpackRequireRuntime = {
  initializeExposesData?: {
    moduleMap?: ExposeModuleMap;
  };
  rscM?: ManifestLike;
};

const setWebpackRequireRuntime = (runtime: WebpackRequireRuntime) => {
  (
    globalThis as typeof globalThis & {
      __webpack_require__?: WebpackRequireRuntime;
    }
  ).__webpack_require__ = runtime;
};

const loadBridgeExposeModule = async () => {
  vi.resetModules();
  return import('./rsc-bridge-expose');
};

afterEach(() => {
  delete (
    globalThis as typeof globalThis & {
      __webpack_require__?: WebpackRequireRuntime;
    }
  ).__webpack_require__;
});

describe('rsc-bridge-expose', () => {
  it('returns remote manifest through getManifest', async () => {
    const manifest: ManifestLike = {
      serverManifest: {
        action: {
          id: 'remote:raw',
        },
      },
    };
    setWebpackRequireRuntime({
      rscM: manifest,
      initializeExposesData: {
        moduleMap: {},
      },
    });

    const { getManifest } = await loadBridgeExposeModule();

    expect(getManifest()).toBe(manifest);
  });

  it('scans exposes and executes action references by raw id', async () => {
    const action = vi.fn(async (value: string) => `ok:${value}`) as {
      (...args: unknown[]): Promise<string>;
      $$id?: string;
    };
    action.$$id = 'raw-action-id';

    const getFactory = vi.fn(async () => () => ({
      nested: {
        action,
      },
    }));

    setWebpackRequireRuntime({
      initializeExposesData: {
        moduleMap: {
          './actions': getFactory,
          './__rspack_rsc_bridge__': vi.fn(async () => () => ({
            ignored: true,
          })),
        },
      },
      rscM: {},
    });

    const bridgeExpose = await loadBridgeExposeModule();

    await expect(
      bridgeExpose.executeAction('raw-action-id', ['value-a']),
    ).resolves.toBe('ok:value-a');
    await expect(
      bridgeExpose.executeAction('raw-action-id', ['value-b']),
    ).resolves.toBe('ok:value-b');

    expect(getFactory).toHaveBeenCalledTimes(1);
    expect(action).toHaveBeenNthCalledWith(1, 'value-a');
    expect(action).toHaveBeenNthCalledWith(2, 'value-b');
  });

  it('returns discovered action ids through getActionIds', async () => {
    const actionOne = vi.fn(async () => 'one') as {
      (...args: unknown[]): Promise<string>;
      $$id?: string;
    };
    const actionTwo = vi.fn(async () => 'two') as {
      (...args: unknown[]): Promise<string>;
      $$id?: string;
    };
    actionOne.$$id = 'raw-action-one';
    actionTwo.$$id = 'raw-action-two';

    setWebpackRequireRuntime({
      initializeExposesData: {
        moduleMap: {
          './actions': async () => () => ({
            nested: { actionOne },
            actionTwo,
          }),
        },
      },
      rscM: {},
    });

    const bridgeExpose = await loadBridgeExposeModule();
    const actionIds = await bridgeExpose.getActionIds();

    expect(actionIds.sort()).toEqual(['raw-action-one', 'raw-action-two']);
  });

  it('normalizes non-array args to empty array before dispatch', async () => {
    const action = vi.fn(async (...args: unknown[]) => args.length) as {
      (...args: unknown[]): Promise<number>;
      $$id?: string;
    };
    action.$$id = 'raw-action-id';

    setWebpackRequireRuntime({
      initializeExposesData: {
        moduleMap: {
          './actions': async () => () => ({ action }),
        },
      },
      rscM: {},
    });

    const bridgeExpose = await loadBridgeExposeModule();

    await expect(
      bridgeExpose.executeAction('raw-action-id', 'not-array' as any),
    ).resolves.toBe(0);
    expect(action).toHaveBeenCalledWith();
  });

  it('throws explicit errors when action id is unresolved', async () => {
    setWebpackRequireRuntime({
      initializeExposesData: {
        moduleMap: {
          './actions': async () => () => ({ value: 'noop' }),
        },
      },
      rscM: {},
    });

    const bridgeExpose = await loadBridgeExposeModule();

    await expect(
      bridgeExpose.executeAction('missing-action-id', []),
    ).rejects.toThrow(/Missing remote action for id "missing-action-id"/);
  });

  it('discovers action references from module cache exports', async () => {
    const cachedAction = vi.fn(async () => 'cached') as {
      (...args: unknown[]): Promise<string>;
      $$id?: string;
    };
    cachedAction.$$id = 'raw-action-from-cache';

    setWebpackRequireRuntime({
      initializeExposesData: {
        moduleMap: {},
      },
      c: {
        cachedModule: {
          exports: {
            nested: {
              cachedAction,
            },
          },
        },
      },
      rscM: {},
    });

    const bridgeExpose = await loadBridgeExposeModule();
    await expect(bridgeExpose.getActionIds()).resolves.toContain(
      'raw-action-from-cache',
    );
    await expect(
      bridgeExpose.executeAction('raw-action-from-cache', []),
    ).resolves.toBe('cached');
  });
});
