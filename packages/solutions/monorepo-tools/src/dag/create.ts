import { INodePackageJson } from '@rushstack/node-core-library';
import { IProjectNode } from '../projects/get-projects';

const initProjectDependencyAndDependent = (
  project: IProjectNode,
  projectsName: string[],
  projectsMap: Map<string, IProjectNode>,
) => {
  // dependencies、devDependencies、peerDependencies
  const dependencies =
    (project.extra.dependencies as INodePackageJson['dependencies']) || {};
  const devDependencies =
    (project.extra.devDependencies as INodePackageJson['devDependencies']) ||
    {};
  const optionalDependencies =
    (project.extra
      .optionalDependencies as INodePackageJson['optionalDependencies']) || {};
  const DependencyProjectsName = Object.keys({
    ...dependencies,
    ...devDependencies,
    ...optionalDependencies,
  }).filter(depName => projectsName.includes(depName));

  // init dependent key
  project.dependent = project.dependent || [];
  // get dependency ProjectNode
  project.dependency = DependencyProjectsName.map(projectName => {
    // 在遍历该项目的 dependency 的时候，顺便更新这些 dependency 的 dependent
    const dependencyProject = projectsMap.get(projectName) as IProjectNode;
    const dependent = dependencyProject?.dependent || [];

    if (
      // 消除重复添加的情况
      !dependent.some(p => p.name === project.name)
    ) {
      dependencyProject.dependent = [...dependent, project];
      dependencyProject.dependentEdge = dependencyProject.dependent.length;
    }

    return dependencyProject;
  });
  // NOTE: 一个节点有多少依赖，就代表有多少的入度或者叫指向该节点的边
  // project.dagNodeEdge = project.dependency.length;
  project.dependencyEdge = project.dependency.length;
};

export const create = (projects: IProjectNode[]) => {
  const projectsName = [];
  const projectsMap = new Map();

  for (const project of projects) {
    projectsMap.set(project.name, project);
    projectsName.push(project.name);
  }

  for (const project of projects) {
    initProjectDependencyAndDependent(project, projectsName, projectsMap);
  }

  return { projectsMap, projectList: projectsName };
};
