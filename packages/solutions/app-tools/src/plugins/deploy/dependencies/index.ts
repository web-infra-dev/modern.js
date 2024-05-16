import path, { isAbsolute } from 'node:path';
import { fs as fse, pkgUp, semver } from '@modern-js/utils';
import type { PackageJson } from 'pkg-types';
import { readPackageJSON } from 'pkg-types';
import { parseNodeModulePath } from 'mlly';
import {
  linkPackage,
  writePackage,
  isFile,
  TracedPackage,
  TracedFile,
  findEntryFiles,
  traceFiles,
  findPackageParents,
  resolveTracedPath,
} from './utils';

export const handleDependencies = async (
  appDir: string,
  serverRootDir: string,
  include: string[],
) => {
  const base = '/';
  const entryFiles = await findEntryFiles(serverRootDir);
  const includeEntries = include.map(item => {
    if (isAbsolute(item)) {
      return item;
    }
    try {
      return require.resolve(item);
    } catch (error) {}
    return item;
  });

  const fileTrace = await traceFiles(
    entryFiles.concat(includeEntries),
    serverRootDir,
    base,
  );

  const currentProjectModules = path.join(appDir, 'node_modules');

  const tracedFiles: Record<string, TracedFile> = Object.fromEntries(
    (await Promise.all(
      [...fileTrace.reasons.entries()].map(async ([_path, reasons]) => {
        if (reasons.ignored) {
          return;
        }

        const filePath = await resolveTracedPath(base, _path);

        if (
          filePath.startsWith(serverRootDir) ||
          (filePath.startsWith(appDir) &&
            !filePath.startsWith(currentProjectModules))
        ) {
          return;
        }

        if (!(await isFile(filePath))) {
          return;
        }

        let baseDir: string | undefined;
        let pkgName: string | undefined;
        let subpath: string | undefined;
        let pkgPath: string | undefined;

        if (filePath.includes('node_modules')) {
          const parsed = parseNodeModulePath(filePath);
          baseDir = parsed.dir;
          pkgName = parsed.name;
          // eslint-disable-next-line prefer-destructuring
          subpath = parsed.subpath;
          pkgPath = path.join(baseDir!, pkgName!);
        } else {
          // For @modern-js/utils, since there are some pre-bundled packages in the package that have their own package.json,
          // and since the relationship between these files uses relative paths, some special handling is required
          const MODERN_UTILS_PATH = 'packages/toolkit/utils';
          const MODERN_UTILS_PATH_REGEX = new RegExp(
            `(.*${MODERN_UTILS_PATH})`,
          );
          const match = filePath.match(MODERN_UTILS_PATH_REGEX);

          const packageJsonPath: string | null = match
            ? path.join(match[0], 'package.json')
            : await pkgUp({ cwd: path.dirname(filePath) });

          if (packageJsonPath) {
            const packageJson: PackageJson = await fse.readJSON(
              packageJsonPath,
            );
            // eslint-disable-next-line no-multi-assign
            pkgPath = baseDir = path.dirname(packageJsonPath);
            subpath = path.relative(baseDir, filePath);
            pkgName = packageJson.name;
          }
        }

        if (!baseDir) {
          return;
        }

        const parents = await Promise.all(
          [...reasons.parents].map(p => resolveTracedPath(base, p)),
        );
        const tracedFile = {
          path: filePath,
          parents,

          subpath,
          pkgName,
          pkgPath,
        } as TracedFile;
        // eslint-disable-next-line consistent-return
        return [filePath, tracedFile];
      }),
    ).then(r => r.filter(Boolean))) as [string, TracedFile][],
  );

  const tracedPackages: Record<string, TracedPackage> = {};
  for (const tracedFile of Object.values(tracedFiles)) {
    const { pkgName } = tracedFile;
    let tracedPackage = tracedPackages[pkgName];

    let pkgJSON = await readPackageJSON(tracedFile.pkgPath, {
      cache: true,
      // eslint-disable-next-line @typescript-eslint/no-empty-function
    }).catch(() => {});
    if (!pkgJSON) {
      pkgJSON = { name: pkgName, version: '0.0.0' } as PackageJson;
    }
    if (!tracedPackage) {
      tracedPackage = {
        name: pkgName,
        versions: {},
      };
      tracedPackages[pkgName] = tracedPackage;
    }
    let tracedPackageVersion = tracedPackage.versions[pkgJSON.version!];
    if (!tracedPackageVersion) {
      tracedPackageVersion = {
        path: tracedFile.pkgPath,
        files: [],
        pkgJSON,
      };
      tracedPackage.versions[pkgJSON.version!] = tracedPackageVersion;
    }

    tracedFile.path.startsWith(tracedFile.pkgPath) &&
      tracedPackageVersion.path === tracedFile.pkgPath &&
      tracedPackageVersion.files.push(tracedFile.path);
    tracedFile.pkgName = pkgName;
    tracedFile.pkgVersion = pkgJSON.version;
  }

  const multiVersionPkgs: Record<string, { [version: string]: string[] }> = {};
  const singleVersionPackages: string[] = [];
  for (const tracedPackage of Object.values(tracedPackages)) {
    const versions = Object.keys(tracedPackage.versions);
    if (versions.length === 1) {
      singleVersionPackages.push(tracedPackage.name);
      continue;
    }
    multiVersionPkgs[tracedPackage.name] = {};
    for (const version of versions) {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
      multiVersionPkgs[tracedPackage.name!][version!] = findPackageParents(
        tracedPackage,
        version,
        tracedFiles,
      );
    }
  }

  await Promise.all(
    singleVersionPackages.map(pkgName => {
      const pkg = tracedPackages[pkgName];
      const version = Object.keys(pkg.versions)[0];
      return writePackage(pkg, version, serverRootDir);
    }),
  );

  for (const [pkgName, pkgVersions] of Object.entries(multiVersionPkgs)) {
    const versionEntires = Object.entries(pkgVersions).sort(
      ([v1, p1], [v2, p2]) => {
        if (p1.length === 0) {
          return -1;
        }
        if (p2.length === 0) {
          return 1;
        }

        return semver.lt(v1, v2, { loose: true }) ? 1 : -1;
      },
    );

    for (const [version, parentPkgs] of versionEntires) {
      const pkg = tracedPackages[pkgName];

      const pkgDestPath = `.modernjs/${pkgName}@${version}/node_modules/${pkgName}`;
      await writePackage(pkg, version, serverRootDir, pkgDestPath);
      await linkPackage(pkgDestPath, `${pkgName}`, serverRootDir);

      for (const parentPkg of parentPkgs) {
        const parentPkgName = parentPkg.replace(/@[^@]+$/, '');
        await (multiVersionPkgs[parentPkgName]
          ? linkPackage(
              pkgDestPath,
              `.modernjs/${parentPkg}/node_modules/${pkgName}`,
              serverRootDir,
            )
          : linkPackage(
              pkgDestPath,
              `${parentPkgName}/node_modules/${pkgName}`,
              serverRootDir,
            ));
      }
    }
  }

  const projectPkg = await readPackageJSON(serverRootDir).catch(
    () => ({} as PackageJson),
  );

  const outputPkgPath = path.join(serverRootDir, 'package.json');
  await fse.writeJSON(outputPkgPath, {
    name: `${projectPkg.name || 'modernjs-project'}-prod`,
    version: projectPkg.version || '0.0.0',
    private: true,
    dependencies: Object.fromEntries(
      [
        ...Object.values(tracedPackages).map(pkg => [
          pkg.name,
          Object.keys(pkg.versions)[0],
        ]),
      ].sort(([a], [b]) => a.localeCompare(b)),
    ),
  });
};
