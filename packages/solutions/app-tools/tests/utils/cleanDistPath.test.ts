import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { cleanDistPath } from '../../src/utils/cleanDistPath';

const makeAPI = (distDirectory: string, cleanDist: boolean | undefined) => ({
  getNormalizedConfig: rstest.fn(() => ({
    output: cleanDist === undefined ? {} : { cleanDistPath: cleanDist },
  })),
  getAppContext: rstest.fn(() => ({ distDirectory })),
});

describe('cleanDistPath', () => {
  let root: string;
  let dist: string;

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'app-tools-clean-dist-'));
    dist = path.join(root, 'dist');
  });

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  it('empties dist when output.cleanDistPath is enabled', async () => {
    fs.mkdirSync(dist, { recursive: true });
    fs.writeFileSync(path.join(dist, 'stale.js'), '// stale build output');

    await cleanDistPath(makeAPI(dist, true) as any);

    expect(fs.existsSync(dist)).toBe(true);
    expect(fs.readdirSync(dist)).toEqual([]);
  });

  it('keeps existing dist output when cleanDistPath is disabled', async () => {
    fs.mkdirSync(dist, { recursive: true });
    fs.writeFileSync(path.join(dist, 'stale.js'), '// stale build output');

    await cleanDistPath(makeAPI(dist, false) as any);

    expect(fs.readdirSync(dist)).toEqual(['stale.js']);
  });

  it('does not touch dist when cleanDistPath is unset', async () => {
    fs.mkdirSync(dist, { recursive: true });
    fs.writeFileSync(path.join(dist, 'stale.js'), '// stale build output');

    await cleanDistPath(makeAPI(dist, undefined) as any);

    expect(fs.readdirSync(dist)).toEqual(['stale.js']);
  });

  it('is a no-op when dist does not exist yet', async () => {
    await expect(
      cleanDistPath(makeAPI(dist, true) as any),
    ).resolves.toBeUndefined();
    expect(fs.existsSync(dist)).toBe(false);
  });
});
