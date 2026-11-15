import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import { loadTypeScriptFile } from '../src/cli/run/config/loadConfig';

const createBundledCjsDependencyFixture = () => {
  const appDirectory = mkdtempSync(
    path.join(tmpdir(), 'modern-plugin-load-config-'),
  );
  const depDirectory = path.join(
    appDirectory,
    'node_modules',
    'fake-esbuild-cjs-dep',
  );

  mkdirSync(depDirectory, { recursive: true });
  writeFileSync(
    path.join(depDirectory, 'package.json'),
    JSON.stringify({
      name: 'fake-esbuild-cjs-dep',
      version: '1.0.0',
      main: 'dep.js',
    }),
  );
  writeFileSync(
    path.join(depDirectory, 'dep.js'),
    `
var __create = Object.create, __defProp = Object.defineProperty, __getOwnPropNames = Object.getOwnPropertyNames, __getProtoOf = Object.getPrototypeOf, __hasOwnProp = Object.prototype.hasOwnProperty, __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __copyProps = (to, from, except, desc) => { if (from && typeof from === "object" || typeof from === "function") { for (let key of __getOwnPropNames(from)) if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable }); } return to; };
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target, mod));
var import_node_path = __toESM(require("node:path"));
module.exports.resolve = () => import_node_path.default.resolve("/a", "b");
module.exports.template = \`
export const generated = 1;
\`;
`,
  );
  writeFileSync(
    path.join(appDirectory, 'modern.config.ts'),
    `
import dep from 'fake-esbuild-cjs-dep';

export default {
  runtime: dep.resolve(),
};
`,
  );

  return appDirectory;
};

describe('load config', () => {
  it('loads TS config importing esbuild-bundled CJS dependencies', () => {
    const appDirectory = createBundledCjsDependencyFixture();

    try {
      const config = loadTypeScriptFile(
        path.join(appDirectory, 'modern.config.ts'),
      );

      expect(config.default || config).toEqual({
        runtime: path.join('/a', 'b'),
      });
    } finally {
      rmSync(appDirectory, { recursive: true, force: true });
    }
  });
});
