import * as path from 'path';
import { globby } from '@modern-js/utils';
import { IProjectNode } from '../../projects/get-projects';
import { IBuildWatchConfig } from '.';

export class WatchedProjectsState {
  private readonly _config: IBuildWatchConfig;

  private readonly _fromNodes: IProjectNode[];

  private _watchProjects: Record<string, IProjectNode>;

  private readonly _projectsFileMap: Map<string, string>;

  constructor(fromNodes: IProjectNode[], config: IBuildWatchConfig) {
    this._fromNodes = fromNodes;
    this._config = config;
    this._projectsFileMap = new Map();
    this._watchProjects = {};
    this._initState();
  }

  private _initState() {
    const globOption = {
      cwd: this._config.rootPath,
      absolute: true,
      expandDirectories: false,
      followSymbolicLinks: false,
      ignore: ['**/node_modules/**', '.project-memory/**', 'dist/**'],
    };
    this._watchProjects = this._fromNodes.reduce<Record<string, IProjectNode>>(
      (ret, node) => {
        const files = globby.sync(`${node.extra.path}/**`, globOption);
        for (const filePath of files) {
          this._projectsFileMap.set(
            path.relative(this._config.rootPath, filePath),
            node.extra.path,
          );
        }
        return {
          ...ret,
          [node.extra.path]: node,
        };
      },
      {},
    );
  }

  public getChangedProject(changedFilPath: string) {
    if (this._projectsFileMap.has(changedFilPath)) {
      const projectPath = this._projectsFileMap.get(changedFilPath) as string;
      return this._watchProjects[projectPath];
    }

    return undefined;
  }

  public getWatchedProjectsPath() {
    return Object.keys(this._watchProjects);
  }

  public updateState() {
    this._initState();
  }

  get watchProjects() {
    return this._watchProjects;
  }

  get watchProjectsName() {
    return Object.keys(this._watchProjects).map(
      projectPath => this._watchProjects[projectPath].name,
    );
  }
}
