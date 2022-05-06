import { join } from 'path';
import ncc from '@vercel/ncc';
import { Package as DtsPacker } from 'dts-packer';
import fs from 'fs-extra';
import { DEFAULT_EXTERNALS } from './constant';
import { pick, replaceFileContent } from './helper';
import type { ParsedTask } from './types';

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
  // Fix webpack-manifest-plugin types
  if (task.depName === 'webpack-manifest-plugin') {
    const pkgPath = require.resolve('webpack-manifest-plugin/package.json');
    const content = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    content.types = 'dist/index.d.ts';
    fs.writeFileSync(pkgPath, JSON.stringify(content));
  }

  try {
    // eslint-disable-next-line no-new
    new DtsPacker({
      cwd: process.cwd(),
      name: task.depName,
      typesRoot: task.distPath,
    });
  } catch (error) {
    console.error(`DtsPacker failed: ${task.depName}`);
    console.error(error);
  }

  // Fix "declare module 'xxx'"
  if (task.depName === 'upath') {
    replaceFileContent(
      join(task.distPath, 'upath.d.ts'),
      content =>
        `${content.replace(
          'declare module "upath"',
          'declare namespace upath',
        )}\nexport = upath;`,
    );
  }

  // Fix globby types, move fast-glob type to correct dir
  if (task.depName === 'globby') {
    fs.copySync(
      join(task.distPath, 'fast-glob/out'),
      join(task.distPath, 'fast-glob'),
    );
    fs.removeSync(join(task.distPath, 'fast-glob/out'));
  }

  // Fix lodash types, copy `common` folder
  if (task.depName === 'lodash') {
    const from = join(process.cwd(), 'node_modules/@types/lodash/common');
    fs.copySync(from, join(task.distPath, 'common'));
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

function emitExtraFiles(task: ParsedTask) {
  const { emitFiles } = task;
  emitFiles.forEach(item => {
    const path = join(task.distPath, item.path);
    fs.outputFileSync(path, item.content);
  });
}

export async function prebundle(task: ParsedTask) {
  console.log(`==== Start prebundle "${task.depName}" ====`);

  if (task.beforeBundle) {
    await task.beforeBundle(task);
  }

  const { code, assets } = await ncc(task.depEntry, {
    minify: task.minify,
    externals: {
      ...DEFAULT_EXTERNALS,
      ...task.externals,
    },
    assetBuilds: false,
  });

  emitIndex(code, task.distPath);
  emitAssets(assets, task.distPath);
  emitDts(task);
  emitLicense(task);
  emitPackageJson(task);
  emitExtraFiles(task);

  console.log(`==== Finish prebundle "${task.depName}" ====\n\n`);
}
