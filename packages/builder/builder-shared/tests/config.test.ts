import { expect, it } from 'vitest';
import { getExtensions } from '../src/config';

it('should get default extensions correctly', async () => {
  expect(getExtensions()).toEqual(['.js', '.jsx', '.mjs', '.json']);
});

it('should get extensions with ts', async () => {
  expect(
    getExtensions({
      isTsProject: true,
    }),
  ).toEqual(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.json']);
});

it('should get extensions with prefix', async () => {
  expect(
    getExtensions({
      resolveExtensionPrefix: '.web',
    }),
  ).toEqual([
    '.web.js',
    '.js',
    '.web.jsx',
    '.jsx',
    '.web.mjs',
    '.mjs',
    '.web.json',
    '.json',
  ]);
});

it('should get extensions with prefix by target', async () => {
  expect(
    getExtensions({
      target: 'node',
      resolveExtensionPrefix: {
        web: '.web',
        node: '.node',
      },
    }),
  ).toEqual([
    '.node.js',
    '.js',
    '.node.jsx',
    '.jsx',
    '.node.mjs',
    '.mjs',
    '.node.json',
    '.json',
  ]);
});
