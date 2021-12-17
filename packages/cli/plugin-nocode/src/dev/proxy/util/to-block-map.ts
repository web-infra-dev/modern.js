import fs from 'fs';
import path from 'path';

const { resolve } = path;

const UNIVERSAL_PACKAGES: any = [];

const getBlock = (
  ret: Record<string, any> = {},
  { code, path: folder, name }: { code: number; path?: string; name: string },
) => {
  if (code === 1) {
    console.error(`[package error] can't found package ${name}.`);
    return ret;
  }

  const umdpath = umdFilePath(folder as string);

  if (!isBlock(folder as string)) {
    return ret;
  }

  const content = fs.readFileSync(umdpath, 'utf-8');

  return {
    ...ret,
    [name]: content,
  };
};

const getBlockInfo = (ret: any[] = [], { code, path: folder, name }: any) => {
  if (code === 1) {
    console.error(`[package error] can't found package ${name}.`);
    return ret;
  }

  if (!isBlock(folder)) {
    return ret;
  }

  const pkgPath = pkgFilePath(folder);

  const pkg = require(pkgPath);

  if (UNIVERSAL_PACKAGES.includes(name)) {
    return ret;
  }

  if (pkg.meta?.contains) {
    return [
      ...ret,
      ...Object.keys(pkg.meta.contains).map(key => ({
        ...pkg.meta.contains[key],
        package_name: pkg.name,
        name: pkg.name,
        compName: key,
      })),
    ];
  }

  return [
    ...ret,
    {
      ...pkg.meta,
      package_name: pkg.name,
      name: pkg.name,
    },
  ];
};

const toBlockMap = () => {
  const cwd = process.cwd();
  const { fesBlocks, packageJson } = getFesBlocks(cwd);
  const fesBlockFolders = [
    ...[...fesBlocks, ...UNIVERSAL_PACKAGES].map(getBlockFolder),
    {
      path: cwd,
      code: 0,
      error: null,
      name: packageJson.name,
    },
  ];
  return {
    blocks: fesBlockFolders.reduce(
      (ret, nextValue) => getBlock(ret, nextValue),
      {},
    ),
    infos: fesBlockFolders.reduce(
      (ret, nextValue) => getBlockInfo(ret, nextValue),
      [] as any[],
    ),
  };
};

const getFesBlocks = (cwd: string) => {
  const packageJson = JSON.parse(
    fs.readFileSync(resolve(cwd, 'package.json'), 'utf-8'),
  );
  const fesBlocks = [
    ...Object.keys(packageJson.dependencies || {}),
    ...Object.keys(packageJson.devDependencies || {}),
  ];
  return { fesBlocks, packageJson };
};

const getBlockFolder = (pkgname: string) => {
  try {
    return {
      code: 0,
      error: null,
      name: pkgname,
      path: path.dirname(require.resolve(`${pkgname}/package.json`)),
    };
  } catch (err) {
    return {
      code: 1,
      name: pkgname,
      error: (err as any).message,
    };
  }
};

const umdFilePath = (folder: string) => resolve(folder, 'dist/umd/index.js');
const pkgFilePath = (folder: string) => resolve(folder, 'package.json');
const isBlock = (folder: string) => {
  const umdpath = umdFilePath(folder);

  return fs.existsSync(umdpath);
};

export default toBlockMap;
