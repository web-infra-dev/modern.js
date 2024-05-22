import path from 'path';
import os from 'node:os';
import { fs as fse } from '@modern-js/utils';
import type { PackageJson } from 'pkg-types';
import { parseNodeModulePath } from 'mlly';
import { nodeFileTrace, resolve } from '@vercel/nft';

export type TracedPackage = {
  name: string;
  versions: Record<
    string,
    {
      pkgJSON: PackageJson;
      path: string;
      isDirectDep: boolean;
      files: string[];
    }
  >;
};

export type TracedFile = {
  path: string;
  subpath: string;
  parents: string[];
  isDirectDep: boolean;

  pkgPath: string;
  pkgName: string;
  pkgVersion?: string;
};

function applyPublicCondition(pkg: PackageJson) {
  if (pkg?.publishConfig?.exports) {
    pkg.exports = pkg?.publishConfig?.exports;
  }
}

export const writePackage = async (
  pkg: TracedPackage,
  version: string,
  projectDir: string,
  _pkgPath?: string,
) => {
  const pkgPath = _pkgPath || pkg.name;
  for (const src of pkg.versions[version].files) {
    if (src.includes('node_modules')) {
      const { subpath } = parseNodeModulePath(src);
      const dest = path.join(projectDir, 'node_modules', pkgPath, subpath!);
      const dirname = path.dirname(dest);
      await fse.ensureDir(dirname);
      await fse.copyFile(src, dest);
    } else {
      // workspace package
      const subpath = path.relative(pkg.versions[version].path, src);
      const dest = path.join(projectDir, 'node_modules', pkgPath, subpath);
      const dirname = path.dirname(dest);
      await fse.ensureDir(dirname);
      await fse.copyFile(src, dest);
    }
  }

  const { pkgJSON } = pkg.versions[version];
  applyPublicCondition(pkgJSON);

  const packageJsonPath = path.join(
    projectDir,
    'node_modules',
    pkgPath,
    'package.json',
  );
  await fse.ensureDir(path.dirname(packageJsonPath));
  await fse.writeFile(packageJsonPath, JSON.stringify(pkgJSON, null, 2));
};

const isWindows = os.platform() === 'win32';
export const linkPackage = async (
  from: string,
  to: string,
  projectRootDir: string,
) => {
  const src = path.join(projectRootDir, 'node_modules', from);
  const dest = path.join(projectRootDir, 'node_modules', to);
  const dstStat = await fse.lstat(dest).catch(() => null);
  const exists = dstStat?.isSymbolicLink();

  if (exists) {
    return;
  }
  await fse.mkdir(path.dirname(dest), { recursive: true });
  await fse
    .symlink(
      path.relative(path.dirname(dest), src),
      dest,
      isWindows ? 'junction' : 'dir',
    )
    .catch(error => {
      console.error('Cannot link', from, 'to', to, error);
    });
};

export const readDirRecursive = async (dir: string): Promise<string[]> => {
  const files = await fse.readdir(dir, { withFileTypes: true });
  const filesAndDirs = await Promise.all(
    files.map(async file => {
      const resPath = path.resolve(dir, file.name);
      return file.isDirectory() ? readDirRecursive(resPath) : resPath;
    }),
  );
  return filesAndDirs.flat();
};

export const isFile = async (file: string) => {
  try {
    const stat = await fse.stat(file);
    return stat.isFile();
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return false;
    }
    throw error;
  }
};

export const findEntryFiles = async (rootDir: string) => {
  const files = await readDirRecursive(rootDir);
  return files;
};

export const findPackageParents = (
  pkg: TracedPackage,
  version: string,
  tracedFiles: Record<string, TracedFile>,
) => {
  const versionFiles: TracedFile[] = pkg.versions[version].files.map(
    path => tracedFiles[path],
  );

  const parentPkgs = [
    ...new Set(
      versionFiles.flatMap(file =>
        file.parents
          .map(parentPath => {
            const parentFile = tracedFiles[parentPath];

            // when parent does not exist, parent may be an entry file.
            if (!parentFile || parentFile.pkgName === pkg.name) {
              return null;
            }
            return `${parentFile.pkgName}@${parentFile.pkgVersion}`;
          })
          .filter(Boolean),
      ),
    ),
  ];
  return parentPkgs as string[];
};

export const traceFiles = async (
  entryFiles: string[],
  serverRootDir: string,
  base = '/',
) => {
  return await nodeFileTrace(entryFiles, {
    base,
    processCwd: serverRootDir,
    resolve: async (id, parent, job, isCjs) => {
      if (id.startsWith('@modern-js/prod-server')) {
        return require.resolve(id, {
          paths: [require.resolve('@modern-js/app-tools')],
        });
      } else {
        return resolve(id, parent, job, isCjs);
      }
    },
  });
};

export const resolveTracedPath = async (
  base: string,
  p: string,
): Promise<string> => fse.realpath(path.resolve(base, p));
