import { join } from 'path';
import ncc from '@vercel/ncc';
import { Package as DtsPacker } from 'dts-packer';
import fs from 'fs-extra';
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
  const packageJsonPath = join(task.depPath, 'package.json');
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

function emitLicense(task: ParsedTask) {
  const licensePath = join(task.depPath, 'LICENSE');
  if (fs.existsSync(licensePath)) {
    fs.copySync(licensePath, join(task.distPath, 'license'));
  }
}

export async function prebundle(task: ParsedTask) {
  console.log(`==== Start prebundle "${task.depName}" ====`);

  externals[task.depName] = task.importPath;

  const entry = require.resolve(task.depPath);
  const { code, assets } = await ncc(entry, {
    minify: true,
    externals,
    assetBuilds: false,
  });

  emitIndex(code, task.distPath);
  emitAssets(assets, task.distPath);
  emitDts(task);
  emitLicense(task);
  emitPackageJson(task);

  console.log(`==== Finish prebundle "${task.depName}" ====\n\n`);
}
