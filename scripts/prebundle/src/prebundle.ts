import { join } from 'path';
import ncc from '@vercel/ncc';
import { Package as DtsPacker } from 'dts-packer';
import fs from 'fs-extra';
import { ParsedTask, pick } from './helper';

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
  try {
    // eslint-disable-next-line no-new
    new DtsPacker({
      cwd: task.packagePath,
      name: task.depName,
      typesRoot: task.distPath,
    });
  } catch (error) {
    console.error(`DtsPacker failed: ${task.depName}`);
    console.error(error);
  }

  // Fix "declare module 'xxx'"
  if (task.depName === 'upath') {
    const filePath = join(task.distPath, 'upath.d.ts');
    const content = fs.readFileSync(filePath, 'utf-8');
    const newContent = `${content.replace(
      'declare module "upath"',
      'declare namespace upath',
    )}\nexport = upath;`;

    fs.writeFileSync(filePath, newContent);
  }
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
      ...task.packageJsonField,
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

  const entry = require.resolve(task.depPath);
  const { code, assets } = await ncc(entry, {
    minify: task.minify,
    externals: task.externals,
    assetBuilds: false,
  });

  emitIndex(code, task.distPath);
  emitAssets(assets, task.distPath);
  emitDts(task);
  emitLicense(task);
  emitPackageJson(task);

  console.log(`==== Finish prebundle "${task.depName}" ====\n\n`);
}
