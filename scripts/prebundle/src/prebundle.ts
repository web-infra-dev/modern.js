import { join } from 'path';
import ncc from '@vercel/ncc';
import { Package as DtsPacker } from 'dts-packer';
import fs from 'fs-extra';
import fastGlob from 'fast-glob';
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

function fixTypeExternalPath(
  file: string,
  task: ParsedTask,
  externals: Record<string, string>,
) {
  const filepath = join(task.distPath, file);

  replaceFileContent(filepath, content => {
    let newContent = content;
    Object.keys(externals).forEach(name => {
      newContent = newContent.replace(
        new RegExp(`../../${name}`, 'g'),
        externals[name],
      );
    });
    return newContent;
  });
}

function emitDts(task: ParsedTask) {
  if (task.ignoreDts) {
    fs.writeFileSync(join(task.distPath, 'index.d.ts'), 'export = any;\n');
    return;
  }

  try {
    const externals = {
      ...DEFAULT_EXTERNALS,
      ...task.externals,
    };
    const { files } = new DtsPacker({
      cwd: process.cwd(),
      name: task.depName,
      typesRoot: task.distPath,
      externals: Object.keys(externals),
    });

    Object.keys(files).forEach(file => {
      fixTypeExternalPath(file, task, externals);
    });
  } catch (error) {
    console.error(`DtsPacker failed: ${task.depName}`);
    console.error(error);
  }
}

function emitPackageJson(task: ParsedTask) {
  const packageJsonPath = join(task.depPath, 'package.json');
  const packageJson = fs.readJsonSync(packageJsonPath, 'utf-8');
  const outputPath = join(task.distPath, 'package.json');

  const pickedPackageJson = pick(packageJson, [
    'name',
    'author',
    'version',
    'funding',
    'license',
    'types',
    'typing',
    'typings',
    ...task.packageJsonField,
  ]);

  if (task.depName !== pickedPackageJson.name) {
    pickedPackageJson.name = task.depName;
  }

  if (task.ignoreDts) {
    delete pickedPackageJson.typing;
    delete pickedPackageJson.typings;
    pickedPackageJson.types = 'index.d.ts';
  }

  fs.writeJSONSync(outputPath, pickedPackageJson);
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

function removeSourceMap(task: ParsedTask) {
  const maps = fastGlob.sync(join(task.distPath, '**/*.map'));
  maps.forEach(mapPath => {
    fs.removeSync(mapPath);
  });
}

function renameDistFolder(task: ParsedTask) {
  const pkgPath = join(task.distPath, 'package.json');
  const pkgJson = fs.readJsonSync(pkgPath, 'utf-8');

  ['types', 'typing', 'typings'].forEach(key => {
    if (pkgJson[key]?.startsWith('dist/')) {
      pkgJson[key] = pkgJson[key].replace('dist/', 'types/');

      const distFolder = join(task.distPath, 'dist');
      const typesFolder = join(task.distPath, 'types');
      if (fs.existsSync(distFolder)) {
        fs.renameSync(distFolder, typesFolder);
      }
    }
  });

  fs.writeJSONSync(pkgPath, pkgJson);
}

export async function prebundle(task: ParsedTask) {
  console.log(`==== Start prebundle "${task.depName}" ====`);

  fs.removeSync(task.distPath);

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
  removeSourceMap(task);
  renameDistFolder(task);

  if (task.afterBundle) {
    await task.afterBundle(task);
  }

  console.log(`==== Finish prebundle "${task.depName}" ====\n\n`);
}
