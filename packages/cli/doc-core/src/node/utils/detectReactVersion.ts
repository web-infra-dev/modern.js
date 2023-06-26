import path from 'path';
import fs from '@modern-js/utils/fs-extra';
import { PACKAGE_ROOT } from '../constants';
import { resolveDepPath } from './flattenMdxContent';

const DEFAULT_REACT_VERSION = 18;

export async function detectReactVersion(): Promise<number> {
  // Detect react version from current cwd
  // return the major version of react
  // if not found, return 18
  const cwd = process.cwd();
  const reactPath = path.join(cwd, 'node_modules', 'react');
  if (await fs.pathExists(reactPath)) {
    const reactPkg = await fs.readJson(path.join(reactPath, 'package.json'));
    const version = Number(reactPkg.version.split('.')[0]);
    return version;
  } else {
    return DEFAULT_REACT_VERSION;
  }
}

export async function resolveReactAlias(reactVersion: number) {
  const basedir =
    reactVersion === DEFAULT_REACT_VERSION ? PACKAGE_ROOT : process.cwd();
  const libPaths = [
    'react',
    'react/jsx-runtime',
    'react/jsx-dev-runtime',
    'react-dom',
    'react-dom/server',
  ];
  if (reactVersion === DEFAULT_REACT_VERSION) {
    libPaths.push('react-dom/client');
  }
  const alias: Record<string, string> = {};
  await Promise.all(
    libPaths.map(async lib => {
      try {
        alias[lib] = await resolveDepPath(lib, basedir, {});
      } catch (e) {
        console.log(`warning: ${lib} not found`);
      }
    }),
  );
  return alias;
}
