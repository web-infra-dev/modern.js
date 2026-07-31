import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { appTools } from '../src';

type PrepareHarness = {
  runPrepare: () => Promise<void>;
  distDirectory: string;
  cleanup: () => void;
};

/**
 * Drive the app-tools plugin `setup`, capture the `onPrepare` callback, and
 * point it at a real temp dist so we can assert the cleanup behavior.
 */
const setupPrepare = ({
  contextCommand,
  cleanDistPath = true,
}: {
  contextCommand: string;
  cleanDistPath?: boolean;
}): PrepareHarness => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'app-tools-prepare-'));
  const distDirectory = path.join(root, 'dist');
  fs.mkdirSync(distDirectory, { recursive: true });
  fs.writeFileSync(path.join(distDirectory, 'stale.js'), '// stale output');

  let prepareCb: (() => Promise<void>) | undefined;
  const appContext = {
    metaName: 'modern-js',
    appDirectory: root,
    distDirectory,
    command: contextCommand,
  };

  const api: any = {
    getAppContext: () => appContext,
    getConfig: () => ({}),
    getNormalizedConfig: () => ({ output: { cleanDistPath } }),
    updateAppContext: () => {},
    addCommand: () => {},
    onPrepare: (cb: () => Promise<void>) => {
      prepareCb = cb;
    },
    addWatchFiles: () => {},
    onFileChanged: () => {},
    onBeforeRestart: () => {},
  };

  const plugin = appTools();
  plugin.setup?.(api);

  return {
    runPrepare: async () => {
      if (!prepareCb) {
        throw new Error('onPrepare callback was not registered');
      }
      await prepareCb();
    },
    distDirectory,
    cleanup: () => fs.rmSync(root, { recursive: true, force: true }),
  };
};

describe('app-tools onPrepare dist cleanup', () => {
  const originalArgv = process.env.MODERN_ARGV;

  afterEach(() => {
    if (originalArgv === undefined) {
      delete process.env.MODERN_ARGV;
    } else {
      process.env.MODERN_ARGV = originalArgv;
    }
  });

  it.each(['dev', 'start', 'build'])(
    'empties dist for programmatic appContext.command=%s',
    async command => {
      // argv is a non-build command (e.g. a test runner), so cleanup must come
      // from the programmatic appContext.command fallback.
      process.env.MODERN_ARGV = 'node rstest test';
      const harness = setupPrepare({ contextCommand: command });
      try {
        await harness.runPrepare();
        expect(fs.existsSync(harness.distDirectory)).toBe(true);
        expect(fs.readdirSync(harness.distDirectory)).toEqual([]);
      } finally {
        harness.cleanup();
      }
    },
  );

  it('does not clean dist when cleanDistPath is disabled', async () => {
    process.env.MODERN_ARGV = 'node rstest test';
    const harness = setupPrepare({
      contextCommand: 'build',
      cleanDistPath: false,
    });
    try {
      await harness.runPrepare();
      expect(fs.readdirSync(harness.distDirectory)).toEqual(['stale.js']);
    } finally {
      harness.cleanup();
    }
  });

  it('does not clean dist for unrelated programmatic commands', async () => {
    process.env.MODERN_ARGV = 'node rstest test';
    const harness = setupPrepare({ contextCommand: 'inspect' });
    try {
      await harness.runPrepare();
      expect(fs.readdirSync(harness.distDirectory)).toEqual(['stale.js']);
    } finally {
      harness.cleanup();
    }
  });

  it('does not clean dist for a programmatic deploy (skipBuild unknown here)', async () => {
    process.env.MODERN_ARGV = 'node rstest test';
    const harness = setupPrepare({ contextCommand: 'deploy' });
    try {
      await harness.runPrepare();
      // deploy is excluded from the programmatic fallback so that
      // deploy({ skipBuild: true }) can preserve the existing dist.
      expect(fs.readdirSync(harness.distDirectory)).toEqual(['stale.js']);
    } finally {
      harness.cleanup();
    }
  });

  it('empties dist for the CLI build command via argv', async () => {
    process.env.MODERN_ARGV = 'node modern build';
    // contextCommand is irrelevant here; argv drives the CLI path.
    const harness = setupPrepare({ contextCommand: '' });
    try {
      await harness.runPrepare();
      expect(fs.readdirSync(harness.distDirectory)).toEqual([]);
    } finally {
      harness.cleanup();
    }
  });

  it('skips cleanup for CLI deploy --skip-build', async () => {
    process.env.MODERN_ARGV = 'node modern deploy --skip-build';
    const harness = setupPrepare({ contextCommand: '' });
    try {
      await harness.runPrepare();
      expect(fs.readdirSync(harness.distDirectory)).toEqual(['stale.js']);
    } finally {
      harness.cleanup();
    }
  });
});
