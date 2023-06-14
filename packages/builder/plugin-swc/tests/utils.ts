import * as path from 'path';
import * as fs from 'fs';
import { Script } from 'node:vm';
import * as swc from '@swc/core';
import { expect } from 'vitest';
import { Output, TransformConfig } from '@modern-js/swc-plugins';
import { merge } from '@modern-js/utils/lodash';
import { getDefaultSwcConfig } from '../src/plugin';

export function isInUpdate(): boolean {
  return process.env.SNAPSHOT_UPDATE === '1';
}

export function replace(
  origin: string,
  replaces: Array<{ match: string | RegExp; mark: string }>,
) {
  return replaces.reduce((pre, cur) => {
    const match = new RegExp(cur.match, 'g');
    return pre.replace(match, cur.mark);
  }, origin);
}

export function replaceCorejsAndSwcHelps(source: string) {
  return replace(source, [
    {
      mark: '"<SWC_HELPER>',
      match: /\".*helpers(?!@)/,
    },
    {
      mark: '"<CORE_JS>',
      match: /\".*core-js(?!@)/,
    },
  ]);
}

/**
 * @param base start directory
 * @param cb when a leaf dir is found, call cb
 *
 * This function will walk through all dir under base directory,
 * and if there is one dir that only contains files, does not contain
 * any more sub dir, this dir is a leaf dir, and will invoke cb like cb(leaf)
 */
export async function walkLeafDir(
  base: string,
  cb: (dir: string) => Promise<void>,
) {
  const dirs = fs.readdirSync(base);
  let isLeaf = true;
  for (const dir of dirs) {
    const next = path.resolve(base, dir);
    if (fs.statSync(next).isDirectory()) {
      isLeaf = false;
      await walkLeafDir(next, cb);
    }
  }

  // leaf node
  if (isLeaf) {
    await cb(base);
  }
}

/**
 * @param ext array of extensions
 * @param base base dir to look up for
 * @param name name of the file
 * @returns file absolute path
 *
 * findPath(['js', 'ts'], '/app/src', index);
 * will try resolve:
 * - /app/src/index.js
 * - /app/src/index.ts
 * return first found path
 */
export function findPath(
  ext: string[],
  base: string,
  name: string,
): string | null {
  const file = ext
    .map(ext => {
      const filePath = path.resolve(base, `${name}.${ext}`);
      if (fs.existsSync(filePath)) {
        return filePath;
      } else {
        return null;
      }
    })
    .filter(Boolean)[0];

  return file;
}

/**
 * @param base base dir
 * @param compileFn fn to invoke compilation
 * 1. compile actual.js, using options in base/option.(json | js)
 * 2. compare compiled file content to expected.js file content, if
 * expected.js is not found, create new one with compiled content.
 */
export async function fsSnapshot(
  base: string,
  compileFn: (
    option: Required<TransformConfig>,
    filename: string,
    code: string,
    map?: string,
  ) => Promise<Output> | Output,
) {
  const actualFile = findPath(['js', 'jsx', 'ts', 'tsx'], base, 'actual')!;
  const actual = fs.readFileSync(actualFile);

  const optionsPath = findPath(['js', 'json'], base, 'option')!;
  let option: TransformConfig;
  if (optionsPath.endsWith('ts')) {
    const { code } = swc.transformFileSync(optionsPath, {
      jsc: {
        externalHelpers: false,
      },
      module: {
        type: 'commonjs',
      },
    });
    const script = new Script(code);
    const module = { exports: {} };
    script.runInContext({
      global,
      module,
    });
    option = module.exports as TransformConfig;
  } else {
    option = require(optionsPath);
  }

  const { code } = await compileFn(
    applyDefaultConfig(option),
    actualFile
      .replace(path.join(__dirname, './fixtures'), '')
      .replace(
        new RegExp(path.sep === '/' ? path.sep : '\\\\', 'g'),
        path.posix.sep,
      ),
    actual.toString(),
  );

  const expectedPath = path.resolve(base, 'expected.js');
  const finalCode = replaceCorejsAndSwcHelps(code);

  if (!fs.existsSync(expectedPath) || isInUpdate()) {
    fs.writeFileSync(expectedPath, finalCode);
  } else {
    const expected = fs.readFileSync(expectedPath).toString();

    expect(finalCode, `Test base: ${base}`).toEqual(
      expected.replace(new RegExp('\r\n', 'g'), '\n'),
    );
  }
}

export function applyDefaultConfig(
  config: TransformConfig,
): Required<TransformConfig> {
  return merge(
    getDefaultSwcConfig(),
    config,
  ) as unknown as Required<TransformConfig>;
}
