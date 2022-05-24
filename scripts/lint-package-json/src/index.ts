import { join } from 'path';
import glob from 'fast-glob';
import logger from 'consola';
import fs from 'fs-extra';
import { ROOT } from './utils';
import { lintExportsField } from './rules/lint-exports-field';
import { lintWorkspaceProtocol } from './rules/lint-workspace-protocol';
import { noCyclicWorkspaceDependencies } from './rules/no-cyclic-workspace-dependencies';

export type PackageJSON = {
  path: string;
  content: {
    name: string;
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    [key: string]: any;
  };
};

async function getAllPackageJson(): Promise<PackageJSON[]> {
  const pattern = join(ROOT, 'packages', '**', 'package.json');
  const files = glob.sync(pattern, {
    ignore: ['**/node_modules/**'],
  });

  const contents = await Promise.all(files.map(file => fs.readJsonSync(file)));

  return files.map((file, index) => ({
    path: file,
    content: contents[index],
  }));
}

async function run() {
  const packageJSONs = await getAllPackageJson();
  const result = [
    lintExportsField(packageJSONs),
    lintWorkspaceProtocol(packageJSONs),
    noCyclicWorkspaceDependencies(packageJSONs),
  ];

  if (result.some(Boolean)) {
    logger.fatal('Lint package.json failed, please fix the errors.');
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  } else {
    logger.success('Lint package.json passed.');
  }
}

run();
