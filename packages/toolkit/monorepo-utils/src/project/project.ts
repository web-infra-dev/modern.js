import path from 'path';
import { fs } from '@modern-js/utils';
import type { INodePackageJson, ExportsConfig } from '../types/packageJson';
import { dlog } from '../debug';
import { readPackageJson } from '../utils';
import { PACKAGE_JSON } from '../constants';

export class Project {
  name: string;

  dir: string;

  metaData!: INodePackageJson;

  constructor(name: string, dir: string) {
    this.name = name;
    this.dir = dir;
  }

  async init() {
    this.metaData = await readPackageJson(path.join(this.dir, PACKAGE_JSON));
  }

  getMetaData() {
    if (this.metaData === null) {
      throw new Error(
        'The Project object needs to be initialized by executing the `init` function',
      );
    }

    return this.metaData;
  }

  getDependentProjects(
    monorepoProjects: Project[],
    options?: { recursive?: boolean },
  ): Project[] {
    const { recursive } = options ?? { recursive: false };
    const allProjectMap = new Map<string, Project>();
    for (const project of monorepoProjects) {
      allProjectMap.set(project.name, project);
    }

    if (!recursive) {
      return this.getDirectDependentProjects(allProjectMap);
    }

    const computedSet = new Set<string>();
    computedSet.add(this.name);

    const queue = this.getDirectDependentProjects(allProjectMap).filter(
      p => !computedSet.has(p.name),
    );
    const result = [];

    while (queue.length > 0) {
      const item = queue.shift() as Project;
      if (computedSet.has(item.name)) {
        continue;
      }

      result.push(item);
      computedSet.add(item.name);
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
    const pkgJson = this.getMetaData();
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
    const pkgJson = this.getMetaData() as INodePackageJson &
      Record<string, string>;

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
