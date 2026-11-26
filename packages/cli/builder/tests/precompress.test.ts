import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { createRsbuild } from '@rsbuild/core';
import { afterAll, beforeAll, describe, expect, it } from '@rstest/core';
import { pluginPrecompress } from '../src/plugins/precompress';

const fixture = path.join(__dirname, '.tmp-precompress');
const dist = path.join(fixture, 'dist');

beforeAll(async () => {
  fs.mkdirSync(path.join(fixture, 'src'), { recursive: true });
  fs.writeFileSync(
    path.join(fixture, 'src/index.js'),
    `console.log(${JSON.stringify('modern '.repeat(2000))});\nimport(/* webpackChunkName: "tiny" */ './tiny.js');`,
  );
  fs.writeFileSync(path.join(fixture, 'src/tiny.js'), 'export const a = 1;');
  const rsbuild = await createRsbuild({
    cwd: fixture,
    rsbuildConfig: {
      output: { distPath: { root: dist }, filenameHash: false, minify: false },
      performance: { printFileSize: false },
      plugins: [pluginPrecompress({ gzip: true })],
    },
  });
  await rsbuild.build();
});

afterAll(() => {
  fs.rmSync(fixture, { recursive: true, force: true });
});

describe('pluginPrecompress', () => {
  it('emits brotli and gzip files that decompress to the original asset', () => {
    const file = path.join(dist, 'static/js/index.js');
    const original = fs.readFileSync(file);
    expect(zlib.brotliDecompressSync(fs.readFileSync(`${file}.br`))).toEqual(
      original,
    );
    expect(zlib.gunzipSync(fs.readFileSync(`${file}.gz`))).toEqual(original);
    expect(fs.statSync(`${file}.br`).size).toBeLessThan(original.length / 5);
  });

  it('skips files below the size threshold', () => {
    expect(fs.existsSync(path.join(dist, 'static/js/async/tiny.js'))).toBe(
      true,
    );
    expect(fs.existsSync(path.join(dist, 'static/js/async/tiny.js.br'))).toBe(
      false,
    );
  });
});
