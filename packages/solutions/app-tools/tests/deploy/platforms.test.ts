import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import appTools from '../../src';
import deployPlugin from '../../src/plugins/deploy';
import { createNetlifyPreset } from '../../src/plugins/deploy/platforms/netlify';
import { createNodePreset } from '../../src/plugins/deploy/platforms/node';
import { createVercelPreset } from '../../src/plugins/deploy/platforms/vercel';

const ndepe = rstest.hoisted(() => ({
  loadCount: 0,
  nodeDepEmit: rstest.fn(),
}));

// The factory only runs when `ndepe` is actually required, so `loadCount`
// tells whether a code path loaded the module.
rstest.mock('ndepe', () => {
  ndepe.loadCount++;
  return { nodeDepEmit: ndepe.nodeDepEmit };
});

const tempDirs: string[] = [];

const createPresetParams = (needModernServer: boolean) => {
  const appDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'app-deploy-'));
  tempDirs.push(appDirectory);
  const distDirectory = path.join(appDirectory, 'dist');
  fs.mkdirSync(distDirectory, { recursive: true });
  return {
    appContext: {
      appDirectory,
      distDirectory,
      moduleType: 'commonjs',
      entrypoints: [],
    } as any,
    modernConfig: {} as any,
    api: {} as any,
    needModernServer,
  };
};

describe('deploy platforms', () => {
  beforeEach(() => {
    ndepe.nodeDepEmit.mockReset();
    rstest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterAll(() => {
    for (const dir of tempDirs) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  // Must run first: later tests load `ndepe` on purpose.
  it('does not load ndepe when loading app-tools or the deploy plugin', async () => {
    expect(appTools).toBeTypeOf('function');
    expect(deployPlugin).toBeTypeOf('function');

    // Static deployments skip dependency tracing and never need ndepe.
    const params = createPresetParams(false);
    await createVercelPreset(params).end?.();
    await createNetlifyPreset(params).end?.();

    expect(ndepe.loadCount).toBe(0);
    expect(ndepe.nodeDepEmit).not.toHaveBeenCalled();
  });

  it('loads ndepe to emit dependencies for the node preset', async () => {
    const params = createPresetParams(true);
    await createNodePreset(params).end?.();

    expect(ndepe.loadCount).toBe(1);
    expect(ndepe.nodeDepEmit).toHaveBeenCalledTimes(1);
    expect(ndepe.nodeDepEmit).toHaveBeenCalledWith(
      expect.objectContaining({
        appDir: params.appContext.appDirectory,
        sourceDir: path.join(params.appContext.appDirectory, '.output'),
        includeEntries: [expect.anything()],
      }),
    );
  });

  it('emits dependencies for the vercel and netlify presets', async () => {
    const params = createPresetParams(true);
    const { appDirectory } = params.appContext;

    await createVercelPreset(params).end?.();
    await createNetlifyPreset(params).end?.();

    expect(ndepe.nodeDepEmit).toHaveBeenCalledTimes(2);
    expect(ndepe.nodeDepEmit).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        appDir: appDirectory,
        sourceDir: path.join(
          appDirectory,
          '.vercel/output/functions/index.func',
        ),
      }),
    );
    expect(ndepe.nodeDepEmit).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        appDir: appDirectory,
        sourceDir: path.join(appDirectory, '.netlify/functions'),
        includeEntries: [expect.anything(), expect.anything()],
      }),
    );
  });
});
