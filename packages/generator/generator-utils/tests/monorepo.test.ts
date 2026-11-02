import fs from 'fs';
import os from 'os';
import path from 'path';
import { getMonorepoPackages } from '../src/utils/monorepo';

describe('getMonorepoPackages', () => {
  let root: string;

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'modern-js-monorepo-'));
    for (const directory of [
      'packages/app',
      'packages/utils',
      'packages/empty',
      'node_modules/ignored',
    ]) {
      fs.mkdirSync(path.join(root, directory), { recursive: true });
    }
    for (const name of ['app', 'utils']) {
      fs.writeFileSync(
        path.join(root, 'packages', name, 'package.json'),
        JSON.stringify({ name }),
      );
    }
    fs.writeFileSync(path.join(root, 'packages/file'), 'not a directory');
    fs.writeFileSync(
      path.join(root, 'node_modules/ignored/package.json'),
      JSON.stringify({ name: 'ignored' }),
    );
  });

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  test.each(['pnpm', 'yarn', 'lerna'])(
    'finds %s workspace packages',
    manager => {
      const packages = ['packages/*', 'node_modules/*'];
      if (manager === 'pnpm') {
        fs.writeFileSync(
          path.join(root, 'pnpm-workspace.yaml'),
          `packages:\n${packages.map(pattern => `  - '${pattern}'`).join('\n')}\n`,
        );
      } else if (manager === 'yarn') {
        fs.writeFileSync(
          path.join(root, 'package.json'),
          JSON.stringify({ workspaces: { packages } }),
        );
      } else {
        fs.writeFileSync(
          path.join(root, 'lerna.json'),
          JSON.stringify({ packages }),
        );
      }

      const result = getMonorepoPackages(root).map(pkg => ({
        name: pkg.name,
        path: path.relative(root, pkg.path),
      }));

      expect(
        result.sort((first, second) => first.name.localeCompare(second.name)),
      ).toEqual([
        { name: 'app', path: path.join('packages', 'app') },
        { name: 'utils', path: path.join('packages', 'utils') },
      ]);
    },
  );
});
