import path from 'path';
import type { INodePackageJson } from '@rushstack/node-core-library';
import { PackageJsonLookup } from '@rushstack/node-core-library';
import { fs } from '@modern-js/utils';
import { dlog } from '../debug';
import type { ExportsConfig } from './packageJson';

export class Project {
  name: string;

  dir: string;

  metaData: INodePackageJson;

  #pkgJsonLp: PackageJsonLookup;

  constructor(name: string, dir: string) {
    this.name = name;
    this.dir = dir;
    this.#pkgJsonLp = new PackageJsonLookup({ loadExtraFields: true });
    this.metaData = this.#pkgJsonLp.loadNodePackageJson(
      path.join(dir, 'package.json'),
    );
  }

  getDependentProjects(
    monorepoProjects: Project[],
    options?: { recursive?: boolean },
  ): Project[] {
    const { recursive } = options ?? { recursive: false };
    const allProjectMap = new Map<string, Project>();
    const computedMap = new Set<string>();
    for (const project of monorepoProjects) {
      allProjectMap.set(project.name, project);
    }

    if (!recursive) {
      return this.getDirectDependentProjects(allProjectMap);
    }

    const queue = this.getDirectDependentProjects(allProjectMap);
    computedMap.add(this.name);
    const result = [];

    while (queue.length > 0) {
      const item = queue.shift() as Project;
      result.push(item);
      const newDeps = item.getDirectDependentProjects(allProjectMap);
      dlog(item.name, ' deps is: ');
      dlog(newDeps);
      if (newDeps.length > 0) {
        queue.push(...newDeps);
      }
    }

    return result;
  }

  getDirectDependentProjects(allProjectMap: Map<string, Project>): Project[] {
    const pkgJson = this.metaData;
    const { dependencies = {}, devDependencies = {} } = pkgJson;
    const projects: Project[] = [];

    for (const d of Object.keys(dependencies)) {
      if (allProjectMap.has(d)) {
        projects.push(allProjectMap.get(d) as Project);
      }
    }

    for (const d of Object.keys(devDependencies)) {
      if (allProjectMap.has(d)) {
        projects.push(allProjectMap.get(d) as Project);
      }
    }
    return projects;
  }

  getSourceEntryPaths(options?: { field?: string; exports: boolean }) {
    const { exports: checkExports = false, field: sourceField = 'source' } =
      options ?? {};
    const pkgJson = this.metaData as INodePackageJson & {
      exports?: ExportsConfig;
    } & Record<string, string>;

    if (!(sourceField in pkgJson)) {
      throw new Error(`${this.name} 的 package.json 没有 ${sourceField} 字段`);
    }
    const sourceDir = path.normalize(pkgJson[sourceField]);
    // normalize strings
    const sourceDirs = [sourceDir];

    if (checkExports) {
      /**
       * analyze exports:
       * "exports": {
       *   ".": {
       *     "source": "./src/index.ts"
       *   }
       * },
       */
      const exportsSourceDirs = this.#getExportsSourceDirs(
        pkgJson.exports ?? {},
        sourceField,
      );
      sourceDirs.push(...exportsSourceDirs);
    }

    return this.#getCommonRootPaths(sourceDirs);
  }

  #getExportsSourceDirs(exportsConfig: ExportsConfig, sourceField: string) {
    const exportsSourceDirs: string[] = [];

    for (const moduleRules of Object.values(exportsConfig)) {
      if (
        typeof moduleRules === 'object' &&
        typeof moduleRules[sourceField] === 'string'
      ) {
        exportsSourceDirs.push(
          path.normalize(moduleRules[sourceField] as string),
        );
      }
    }

    // normalize strings
    return exportsSourceDirs;
  }

  /**
   *
   * @param paths normalize paths
   * @returns common root paths
   */
  #getCommonRootPaths(paths: string[]) {
    const commonRootPathsSet = new Set<string>();
    for (const p of paths) {
      let dir: string;
      try {
        dir = fs.statSync(p).isDirectory() ? p : path.dirname(p);
      } catch {
        dir = path.dirname(p);
      }
      const rootPath = this.#getRootPath(dir);
      if (!commonRootPathsSet.has(rootPath)) {
        commonRootPathsSet.add(rootPath);
      }
    }

    return Array.from(commonRootPathsSet).map(p => path.join(this.dir, p));
  }

  #getRootPath(p: string) {
    return p.split(path.sep)[0];
  }
}
