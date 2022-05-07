import { errorLog } from '../log/error';
import { Package } from '../package';
import { getMonorepoBaseData } from '../parse-config/monorepo';
import {
  getProjectsByPackageConfig,
  syncGetProjectsByPackageConfig,
} from './get-projects-by-packages-config';
import {
  getProjectsByWorkspaceFile,
  syncGetProjectsByWorkspaceFile,
} from './get-projects-by-workspace-file';

export interface IFindSubProjectConfig {
  packagesMatchs?:
    | string[]
    | {
        enableAutoFinder?: boolean;
        workspaceFile?: string;
      };
  projectsConfig?: {
    name: string;
    path: string;
  }[];

  /**
   * https://github.com/mrmlnc/fast-glob#ignore
   */
  packagesIgnoreMatchs?: string[];
}

export interface IProjectNode {
  name: string;
  // 在算法中这个的长度是入度的值
  dependency?: IProjectNode[]; // dependencies、devDependencies、peerDependencies
  dependent?: IProjectNode[]; // dependent
  extra: { path: string } & Record<string, any>;
  // DAG NODE
  // dagNodeEdge: number;
  dependencyEdge: number;
  dependentEdge: number;
  // Circular dependency
  checkedCircle: boolean;
  circlePath: string[];
  criticalPathLength?: number;
}

export type IMonorepoSubProject = IProjectNode;

enum FindProjectsMode {
  Rough,
  Precise,
}

const getProjectsByProjectsConfig = (
  rootPath: string,
  configs: IFindSubProjectConfig['projectsConfig'] = [],
): IMonorepoSubProject[] => {
  const subProjects: IMonorepoSubProject[] = [];

  for (const config of configs) {
    subProjects.push({
      name: config.name,
      extra: { path: config.path },
      // dagNodeEdge: 0,
      dependencyEdge: 0,
      dependentEdge: 0,
      checkedCircle: false,
      circlePath: [],
    });
  }

  return subProjects;
};

const getProjectsByPackagesMatch = async (
  rootPath: string,
  match: IFindSubProjectConfig['packagesMatchs'],
  ignore: string[],
): Promise<IMonorepoSubProject[]> => {
  let projects: Package[] = [];

  if (Array.isArray(match)) {
    // like lerna`s packages config
    projects = await getProjectsByPackageConfig(rootPath, match, ignore);
  } else {
    // use workspace file
    projects = await getProjectsByWorkspaceFile(
      rootPath,
      match as { workspaceFile: string },
      ignore,
    );
  }

  const subProjects: IMonorepoSubProject[] = [];

  for (const project of projects) {
    subProjects.push({
      name: project.name,
      extra: {
        path: project.path,
        ...project.json,
      },
      // dagNodeEdge: 0,
      dependencyEdge: 0,
      dependentEdge: 0,
      checkedCircle: false,
      circlePath: [],
    });
  }

  return subProjects;
};

const syncGetProjectsByPackagesMatch = (
  rootPath: string,
  match: IFindSubProjectConfig['packagesMatchs'],
  ignore: string[],
): IMonorepoSubProject[] => {
  let projects: Package[] = [];
  // TODO: code start
  if (Array.isArray(match)) {
    // like lerna`s packages config
    projects = syncGetProjectsByPackageConfig(rootPath, match, ignore);
  } else {
    // use workspace file
    projects = syncGetProjectsByWorkspaceFile(
      rootPath,
      match as { workspaceFile: string },
      ignore,
    );
  }

  const subProjects: IMonorepoSubProject[] = [];

  for (const project of projects) {
    subProjects.push({
      name: project.name,
      extra: {
        path: project.path,
        ...project.json,
      },
      // dagNodeEdge: 0,
      dependencyEdge: 0,
      dependentEdge: 0,
      checkedCircle: false,
      circlePath: [],
    });
  }

  return subProjects;
};

const checkFindProjectsMode = (
  config: IFindSubProjectConfig,
  // eslint-disable-next-line consistent-return
): FindProjectsMode | undefined => {
  if (config.packagesMatchs && Array.isArray(config.packagesMatchs)) {
    return FindProjectsMode.Rough;
  }

  if (
    config.packagesMatchs &&
    typeof config.packagesMatchs === 'object' &&
    (config.packagesMatchs.workspaceFile ||
      config.packagesMatchs.enableAutoFinder)
  ) {
    return FindProjectsMode.Rough;
  }

  if (config.projectsConfig && Array.isArray(config.projectsConfig)) {
    return FindProjectsMode.Precise;
  }

  if (config.projectsConfig && config.packagesMatchs) {
    errorLog('There can not be both `packagesMatchs` and `projectsConfig`');
  }

  errorLog('No `packagesMatchs` and `projectsConfig` configurations found');
};

export const getProjects = async (
  config: IFindSubProjectConfig,
  currentDir: string = process.cwd(),
): Promise<IMonorepoSubProject[]> => {
  const { rootPath } = getMonorepoBaseData(currentDir);
  const mode = checkFindProjectsMode(config);

  let projects: IMonorepoSubProject[] = [];
  if (mode === FindProjectsMode.Rough) {
    projects = await getProjectsByPackagesMatch(
      rootPath,
      config.packagesMatchs,
      config.packagesIgnoreMatchs || [],
    );
  } else if (mode === FindProjectsMode.Precise) {
    projects = getProjectsByProjectsConfig(rootPath, config.projectsConfig);
  }

  return projects;
};

export const syncGetProjects = (
  config: IFindSubProjectConfig,
  currentDir: string = process.cwd(),
): IMonorepoSubProject[] => {
  const { rootPath } = getMonorepoBaseData(currentDir);
  const mode = checkFindProjectsMode(config);

  let projects: IMonorepoSubProject[] = [];
  if (mode === FindProjectsMode.Rough) {
    projects = syncGetProjectsByPackagesMatch(
      rootPath,
      config.packagesMatchs,
      config.packagesIgnoreMatchs || [],
    );
  } else if (mode === FindProjectsMode.Precise) {
    projects = getProjectsByProjectsConfig(rootPath, config.projectsConfig);
  }

  return projects;
};
