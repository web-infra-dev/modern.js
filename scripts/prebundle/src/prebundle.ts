import { dirname, join } from 'path';
import ncc from '@vercel/ncc';
import { Package as DtsPacker } from 'dts-packer';
import fastGlob from 'fast-glob';
import fs from 'fs-extra';
import { DEFAULT_EXTERNALS } from './constant';
import { copyLicense, pick, replaceFileContent } from './helper';
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

function emitESMIndex(code: string, distPath: string) {
  const distIndex = join(distPath, 'index.mjs');
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

function emitDts(task: ParsedTask): string | undefined {
  if (!task.emitDts) {
    return;
  }

  const externals = {
    ...DEFAULT_EXTERNALS,
    ...task.externals,
  };

  if (typeof task.emitDts === 'function') {
    return task.emitDts(task, externals) ?? undefined;
  }

  if (task.ignoreDts) {
    fs.writeFileSync(join(task.distPath, 'index.d.ts'), 'export = any;\n');
    return;
  }

  const { files } = new DtsPacker({
    cwd: process.cwd(),
    name: task.depName,
    typesRoot: task.distPath,
    externals: Object.keys(externals),
  });

  Object.keys(files).forEach(file => {
    fixTypeExternalPath(file, task, externals);
  });
}

function emitPackageJson(task: ParsedTask, resolvedTypesEntry?: string) {
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

  if (task.depEsmEntry) {
    pickedPackageJson.main = 'index.js';
    pickedPackageJson.module = 'index.mjs';
  }

  if (task.depName !== pickedPackageJson.name) {
    pickedPackageJson.name = task.depName;
  }

  if (task.ignoreDts) {
    delete pickedPackageJson.typing;
    delete pickedPackageJson.typings;
    pickedPackageJson.types = 'index.d.ts';
  } else if (resolvedTypesEntry) {
    const existingTypes = (
      pickedPackageJson.types ??
      pickedPackageJson.typings ??
      pickedPackageJson.typing
    )?.replace(/^\.\//, '');
    if (
      existingTypes !== resolvedTypesEntry &&
      (existingTypes !== undefined || resolvedTypesEntry !== 'index.d.ts')
    ) {
      delete pickedPackageJson.typing;
      delete pickedPackageJson.typings;
      pickedPackageJson.types = resolvedTypesEntry;
    }
  }

  fs.writeJSONSync(outputPath, pickedPackageJson);
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

async function build(task: ParsedTask) {
  if (task.beforeBundle) {
    await task.beforeBundle(task);
  }

  const { code, assets } = await ncc(task.depEntry, {
    externals: {
      ...DEFAULT_EXTERNALS,
      ...task.externals,
    },
    assetBuilds: false,
    minify: task.minify,
    esm: false,
  });

  if (task.depEsmEntry) {
    const { code: esmCode } = await ncc(task.depEsmEntry, {
      externals: {
        ...DEFAULT_EXTERNALS,
        ...task.externals,
      },
      assetBuilds: false,
      minify: task.minify,
      esm: true,
    });
    emitESMIndex(esmCode, task.distPath);
  }

  emitIndex(code, task.distPath);
  emitAssets(assets, task.distPath);
  const resolvedTypesEntry = emitDts(task);
  copyLicense(task.depPath, task.distPath);
  emitPackageJson(task, resolvedTypesEntry);
  removeSourceMap(task);
  renameDistFolder(task);
  emitExtraFiles(task);

  if (task.afterBundle) {
    await task.afterBundle(task);
  }
}

export async function prebundle(task: ParsedTask) {
  console.log(`==== Start prebundle "${task.depName}" ====`);
  fs.ensureDirSync(dirname(task.distPath));
  const staging = fs.mkdtempSync(`${task.distPath}-`);
  try {
    if (!task.clear && fs.existsSync(task.distPath)) {
      fs.copySync(task.distPath, staging);
    }
    await build({ ...task, distPath: staging });
    fs.moveSync(staging, task.distPath, { overwrite: true });
  } finally {
    fs.removeSync(staging);
  }
  console.log(`==== Finish prebundle "${task.depName}" ====\n\n`);
}
