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
  cleanDistPath = true,
  contextCommand,
}: {
  cleanDistPath?: boolean;
  contextCommand?: string;
} = {}): PrepareHarness => {
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

  it('does not clean dist when cleanDistPath is disabled', async () => {
    process.env.MODERN_ARGV = 'node modern build';
    const harness = setupPrepare({ cleanDistPath: false });
    try {
      await harness.runPrepare();
      expect(fs.readdirSync(harness.distDirectory)).toEqual(['stale.js']);
    } finally {
      harness.cleanup();
    }
  });

  it('does not clean dist for unrelated commands', async () => {
    process.env.MODERN_ARGV = 'node rstest test';
    const harness = setupPrepare();
    try {
      await harness.runPrepare();
      expect(fs.readdirSync(harness.distDirectory)).toEqual(['stale.js']);
    } finally {
      harness.cleanup();
    }
  });

  it('does not clean dist from appContext.command alone', async () => {
    process.env.MODERN_ARGV = 'node rstest test';
    const harness = setupPrepare({ contextCommand: 'build' });
    try {
      await harness.runPrepare();
      expect(fs.readdirSync(harness.distDirectory)).toEqual(['stale.js']);
    } finally {
      harness.cleanup();
    }
  });

  it('empties dist for the CLI build command via argv', async () => {
    process.env.MODERN_ARGV = 'node modern build';
    const harness = setupPrepare();
    try {
      await harness.runPrepare();
      expect(fs.readdirSync(harness.distDirectory)).toEqual([]);
    } finally {
      harness.cleanup();
    }
  });

  it('skips cleanup for CLI deploy --skip-build', async () => {
    process.env.MODERN_ARGV = 'node modern deploy --skip-build';
    const harness = setupPrepare();
    try {
      await harness.runPrepare();
      expect(fs.readdirSync(harness.distDirectory)).toEqual(['stale.js']);
    } finally {
      harness.cleanup();
    }
  });
});
