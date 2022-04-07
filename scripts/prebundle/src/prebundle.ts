import { join } from 'path';
import ncc from '@vercel/ncc';
import { Package as DtsPacker } from 'dts-packer';
import { fs } from '@modern-js/utils';
import { ParsedTask, pick } from './helper';

const externals: Record<string, string> = {};

function emitAssets(
  assets: Record<string, { source: string }>,
  distPath: string,
) {
  for (const key of Object.keys(assets)) {
    const asset = assets[key];
    fs.outputFileSync(join(distPath, key), asset.source);
  }
}

function emitIndex(code: string, distPath: string) {
  const distIndex = join(distPath, 'index.js');
  fs.outputFileSync(distIndex, code);
}

function emitDts(task: ParsedTask) {
  return new DtsPacker({
    cwd: task.packagePath,
    name: task.depName,
    typesRoot: task.distPath,
  });
}

function emitPackageJson(task: ParsedTask) {
  const packageJsonPath = require.resolve(join(task.depName, 'package.json'), {
    paths: [join(task.packagePath, 'node_modules')],
  });
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  const outputPath = join(task.distPath, 'package.json');

  fs.writeJSONSync(
    outputPath,
    pick(packageJson, [
      'name',
      'author',
      'version',
      'funding',
      'license',
      'types',
      'typing',
      'typings',
    ]),
  );
}

function findEntry(task: ParsedTask) {
  return require.resolve(task.depName, {
    paths: [join(task.packagePath, 'node_modules')],
  });
}

export async function prebundle(task: ParsedTask) {
  externals[task.depName] = task.importPath;

  const entry = findEntry(task);
  const { code, assets } = await ncc(entry, {
    externals,
    assetBuilds: false,
  });

  emitIndex(code, task.distPath);
  emitAssets(assets, task.distPath);
  emitDts(task);
  emitPackageJson(task);
}
