import fs from 'node:fs/promises';
import path from 'node:path';
import { modernPackage, resolvePackageRoot } from './packages.mjs';

export const appTools = modernPackage('@modern-js/app-tools');
export const runtime = modernPackage('@modern-js/runtime');
export const react = resolvePackageRoot('react');
export const reactDOM = resolvePackageRoot('react-dom');

export async function linkDependencies(dir) {
  const modules = path.join(dir, 'node_modules');
  if ((await fs.lstat(modules).catch(() => null))?.isSymbolicLink())
    await fs.unlink(modules);
  await fs.mkdir(modules, { recursive: true });
  const overrides = {
    '@modern-js/app-tools': appTools,
    '@modern-js/runtime': runtime,
    react,
    'react-dom': reactDOM,
  };
  for (const name of [
    '@modern-js/app-tools',
    '@modern-js/runtime',
    '@modern-js/plugin-module-federation',
    '@modern-js/tsconfig',
    '@module-federation/enhanced',
    'react',
    'react-dom',
  ]) {
    const target = path.join(modules, name);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.symlink(overrides[name] || resolvePackageRoot(name), target);
  }
}
export async function prepareApp(directory, name) {
  await fs.mkdir(path.join(directory, 'src/routes'), { recursive: true });
  await linkDependencies(directory);
  const version = async root =>
    JSON.parse(await fs.readFile(path.join(root, 'package.json'), 'utf8'))
      .version;
  await fs.writeFile(
    path.join(directory, 'package.json'),
    JSON.stringify({
      name,
      private: true,
      dependencies: {
        react: await version(react),
        'react-dom': await version(reactDOM),
        '@modern-js/runtime': await version(runtime),
      },
    }),
  );
  await fs.writeFile(
    path.join(directory, 'tsconfig.json'),
    JSON.stringify({ compilerOptions: { jsx: 'react-jsx' } }),
  );
  await fs.writeFile(
    path.join(directory, 'src/routes/layout.tsx'),
    "import {Outlet} from '@modern-js/runtime/router'; export default () => <Outlet/>;",
  );
}
