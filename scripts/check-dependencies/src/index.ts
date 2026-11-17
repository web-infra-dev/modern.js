import path from 'node:path';
import logger from 'consola';
import { lintExportsField } from './rules/lintExportsField';
import { lintWorkspaceProtocol } from './rules/lintWorkspaceProtocol';
import { noCyclicWorkspaceDependencies } from './rules/noCyclicWorkspaceDependencies';
import type { PackageManifest } from './sourceDependencies';
import {
  checkSourceDependencies,
  createSourceInput,
  readManifests,
} from './sourceDependencies';
import { ROOT } from './utils';

export interface PackageJSON {
  path: string;
  content: PackageManifest;
}

async function run() {
  const input = await createSourceInput(
    ROOT,
    process.argv.includes('--staged'),
  );
  const packageJSONs = await readManifests(input);
  const selected = input.changed
    ? packageJSONs.filter(item =>
        input.changed!.some(file => item.path === path.join(ROOT, file)),
      )
    : packageJSONs;
  const result = [
    lintExportsField(selected),
    lintWorkspaceProtocol(selected),
    noCyclicWorkspaceDependencies(packageJSONs),
  ];
  const issues = await checkSourceDependencies(input);
  for (const issue of issues) {
    logger.error(
      `[undeclared-dependency] ${issue.package} ${issue.file}:${issue.line} imports undeclared ${issue.dependency}`,
    );
  }
  if (result.some(Boolean) || issues.length > 0) {
    logger.fatal('Lint package.json failed, please fix the errors.');
    process.exitCode = 1;
  } else {
    logger.success('Lint package.json passed.');
  }
}

run().catch(error => {
  logger.error(error);
  process.exitCode = 1;
});
