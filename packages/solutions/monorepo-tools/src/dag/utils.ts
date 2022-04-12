import { IProjectNode } from '../projects/get-projects';
import { errorLog } from '../log/error';
import { EdgeManager } from './edge-manager';

/**
 * Calculate the number of packages which must be built before we reach
 * the furthest away "root" node
 */
export const calculateCriticalPaths = (project: IProjectNode): number => {
  // Return the memoized value
  if (project.criticalPathLength !== undefined) {
    return project.criticalPathLength;
  }

  // If no dependents, we are in a "root"
  if (project.dependent?.length === 0) {
    project.criticalPathLength = 0;
    return project.criticalPathLength;
  } else {
    // Otherwise we are as long as the longest package + 1
    const depsLengths: number[] = [];
    project.dependent?.forEach(dependentProject =>
      depsLengths.push(calculateCriticalPaths(dependentProject)),
    );
    project.criticalPathLength = Math.max(...depsLengths) + 1;
    return project.criticalPathLength;
  }
};

const _recursiveGetDependencySkipCircleDeps = (node: IProjectNode) => {
  let allDeps: IProjectNode[] = [];
  const foundDepsNameSet = new Set([node.name]);

  let queue = [node];

  while (queue.length > 0) {
    const checkNode = queue.pop() as IProjectNode;
    const checkNodeDeps = checkNode.dependency || [];
    if (checkNodeDeps.length > 0) {
      const willIntoQueue = checkNodeDeps.filter(
        dep => !foundDepsNameSet.has(dep.name),
      );
      allDeps = [...allDeps, ...willIntoQueue];
      willIntoQueue.forEach(dep => foundDepsNameSet.add(dep.name));
      queue = [...queue, ...willIntoQueue];
    }
  }
  return allDeps;
};

export const recursiveGetDependency = (
  project: IProjectNode,
  skipCircleProjects = false,
) => {
  if (skipCircleProjects) {
    return _recursiveGetDependencySkipCircleDeps(project);
  }

  const dependency = project.dependency || [];

  let allDependency: IProjectNode[] = [...dependency];

  for (const dependencyProject of dependency) {
    allDependency = [
      ...allDependency,
      ...recursiveGetDependency(dependencyProject),
    ];
  }

  return allDependency;
};

// 拓扑排序
export const sortProjects = (projects: IProjectNode[]) => {
  const sortedQueue = []; // 排好序的队列
  let readyIntoSortedQueue = []; // 用来准备放入 sortedQueue的数组
  let queue: IProjectNode[] = []; // 用来存放入度为0的节点
  const edgeManager = new EdgeManager();
  // 初始化队列queue
  for (const project of projects) {
    edgeManager.setEdge(project);
    // 入度为0进队列
    // TODO 可能存在多个 dagNodeFrom === 0 的节点
    if (edgeManager.getEdge(project) === 0) {
      queue.push(project);
    }
  }

  // 加入最初入度为0的节点
  sortedQueue.push([...queue]);

  let shiftNodesCount = 0; // 计算出队列的节点数量，用于在最后判断是否存在环/依赖循环

  while (queue.length > 0) {
    const checkNode = queue.shift() as IProjectNode;
    shiftNodesCount++;
    for (const toNode of checkNode.dependent as IProjectNode[]) {
      edgeManager.reduceOneEdge(toNode);

      if (edgeManager.getEdge(toNode) === 0) {
        readyIntoSortedQueue.push(toNode);
      }
    }

    if (queue.length === 0 && readyIntoSortedQueue.length > 0) {
      queue = [...readyIntoSortedQueue];
      sortedQueue.push([...readyIntoSortedQueue]);
      readyIntoSortedQueue = [];
    }
  }

  if (shiftNodesCount < projects.length) {
    errorLog('Items with a dependency loop');
  } else {
    // console.info('No dependency loop');
  }

  return sortedQueue;
};

export const findCircle = (projects: IProjectNode[]) => {
  let result = projects.reduce<IProjectNode[]>((circleNodes, project) => {
    if (project.dependencyEdge > 0) {
      return [...circleNodes, project];
    }

    return circleNodes;
  }, []);
  result = result.sort((a, b) => a.dependencyEdge - b.dependencyEdge);
  while (result.length > 0) {
    const checkNode = result.shift() as IProjectNode;
    checkNode.dependencyEdge--;
  }
};
