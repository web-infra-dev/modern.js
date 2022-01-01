import pMap from 'p-map';
import { IProjectNode } from '../projects/get-projects';
import { TaskRunner, TaskFunType } from './task';
import { EdgeManager } from './edge-manager';
import { recursiveGetDependency, sortProjects } from './utils';
import { errorLog } from '../log/error';

export type Task = (
  currentProject: IProjectNode,
  // 当前项目前一个阶段运行的项目集合
  currentProjectPreviousProjects: IProjectNode[],
  earlyFinishFun: () => void,
) => Promise<void>;

export interface ITraverseConfig {
  withSelf?: boolean;
  runTaskConcurrency?: number;
}

export class DagOperator {
  _projects: IProjectNode[];

  _projectsMap: Map<string, IProjectNode>;

  // 排序好的项目列表
  _sortedProjects: IProjectNode[][];

  constructor(
    projects: IProjectNode[],
    projectsMap: Map<string, IProjectNode>,
  ) {
    this._projects = projects;
    this._projectsMap = projectsMap;
    this._sortedProjects = [];
  }

  public checkNodeDataExist(name: string) {
    return this._projectsMap.has(name);
  }

  getNodeData(name: string, option: { checkExist: true }): IProjectNode;
  getNodeData(name: string): IProjectNode | undefined;
  public getNodeData(
    name: string,
    option: { checkExist: boolean } = { checkExist: false },
  ) {
    if (option.checkExist) {
      if (this._projectsMap.has(name)) {
        return this._projectsMap.get(name);
      } else {
        errorLog(`No '${name}' project exist`);
      }
    }

    return this._projectsMap.get(name);
  }

  public getNodeDependencyData(name: string) {
    return this._projectsMap.get(name)?.dependency || [];
  }

  public getNodeDependentData(name: string) {
    return this._projectsMap.get(name)?.dependent || [];
  }

  public getNodeAllDependencyData(
    name: string,
    option: { skipCircleCheck: boolean } = { skipCircleCheck: false },
  ) {
    const { skipCircleCheck } = option;
    if (!skipCircleCheck) {
      this.checkCircle();
    }
    if (!this._projectsMap.has(name)) {
      errorLog(`No '${name}' project exist`);
    }

    const currentNode = this._projectsMap.get(name) as IProjectNode;

    return recursiveGetDependency(currentNode, skipCircleCheck);
  }

  public setNodeData(name: string, task: (project: IProjectNode) => void) {
    if (this._projectsMap.has(name)) {
      task(this._projectsMap.get(name) as IProjectNode);
    } else {
      errorLog(`No '${name}' project exist`);
    }
  }

  public async traverseAllNodes(task: Task) {
    const sortedNodes =
      this._sortedProjects.length > 0
        ? this._sortedProjects
        : sortProjects(this._projects);

    const finishTaskHash: Record<string, boolean> = {};
    let preNodes: IProjectNode[] = [];
    let earlyFinish = false;

    for (const projects of sortedNodes) {
      if (earlyFinish) {
        break;
      }
      await pMap(
        projects,
        // eslint-disable-next-line @typescript-eslint/no-loop-func
        async project => {
          if (!finishTaskHash[project.name]) {
            finishTaskHash[project.name] = true;
            await task(
              project,
              this._getProjectPreviousNode(project.dependent || [], preNodes),
              () => (earlyFinish = true),
            );
          }
        },
        { concurrency: projects.length },
      );

      preNodes = [...projects];
    }
  }

  public checkCircle() {
    // this._sortedProjects = sortProjects(this._projects);
    this._checkForCyclicDependencies(this._projects, [], new Set<string>());
  }

  public async traverseDependenciesToProjectToDependent(
    name: string,
    task: Task,
    config: ITraverseConfig = {},
  ) {
    await this.traverseDependenciesToProject(name, task, config);
    await this.traverseProjectToDependent(name, task, {
      ...config,
      withSelf: false,
    });
  }

  /**
   * 1. 把目标节点当做叶子节点集合 A 中的元素
   * 2. 当叶子节点集合中某个 a 元素结束任务的时候进行如下操作：
   * 2.1 剪(去额外的)枝：获取 a 元素的 dependent集合，将该集合中元素的依赖列表进行过滤，过滤条件为：排除 a 以及 a 元素的 dependent集合以外的元素。
   * 2.2 入度减一：对 a 元素的 dependent 集合元素的 dependencyEdge 减一
   * 3. 检查是否存在 dependencyEdge === 0 的节点，加入叶子节点集合 A中。
   * 4. 根据情况（是否存在空闲的进程）选择是否执行新加入的节点对应的任务。
   */

  public async traverseProjectToDependent(
    name: string,
    task: Task,
    { withSelf = false, runTaskConcurrency }: ITraverseConfig = {},
  ) {
    if (!this._projectsMap.has(name)) {
      errorLog(`No '${name}' project exist`);
    }
    const traverseTargetNode = this._projectsMap.get(name) as IProjectNode;

    const leafNodeTasks = [
      withSelf
        ? this._createTask(traverseTargetNode, task)
        : async () => Promise.resolve(traverseTargetNode.name),
    ];

    const taskRunner = new TaskRunner(leafNodeTasks, {
      concurrency: runTaskConcurrency,
    });

    const edgeManager = new EdgeManager();

    taskRunner.on(TaskRunner.TASK_FINISH, (projectName: string) => {
      const projectNode = this.getNodeData(projectName) as IProjectNode;
      const dependent = projectNode.dependent || [];
      for (const dependentProject of dependent) {
        const dependency = dependentProject.dependency || [];
        const removeNodes = dependency.filter(
          dependencyProject =>
            ![projectName, ...dependent.map(p => p.name)].includes(
              dependencyProject.name,
            ),
        );

        edgeManager.reduceEdges(dependentProject, removeNodes.length + 1);
        // 变成叶子节点，就加入执行任务的队列中
        if (edgeManager.getEdge(dependentProject) === 0) {
          taskRunner.addTask(this._createTask(dependentProject, task));
        }
      }
    });

    await taskRunner.run();
  }

  /**
   * 1. 找到叶子节点集合 A
   * 2. 找到直接连接叶子节点的节点集合 B
   * 3. 当有某个叶子节点结束任务，则对该节点的直接连接的节点（或者理解成dependent）的枝数（或者叫入度）减一。
   * 4. 检查 B 集合中是否存在入度为0的节点，则此节点为叶子节点，并加入叶子节点集合 A
   * 5. 根据情况（是否存在空闲的进程）选择是否执行新加入的节点对应的任务。
   */

  // TODO: 执行顺序还需要再确定一下
  public async traverseDependenciesToProject(
    name: string,
    task: Task,
    { withSelf = false, runTaskConcurrency }: ITraverseConfig = {},
  ) {
    if (!this._projectsMap.has(name)) {
      errorLog(`No '${name}' project exist`);
    }

    const traverseTargetNode = this._projectsMap.get(name) as IProjectNode;
    const leafNodes = this._getDependencyLeafNodes(traverseTargetNode);

    if (leafNodes?.length === 0) {
      await this._createTask(traverseTargetNode, task)();
      return;
    }

    const leafNodeTasks = leafNodes.map<TaskFunType<string>>(project =>
      this._createTask(project, task),
    );
    const taskRunner = new TaskRunner(leafNodeTasks, {
      concurrency: runTaskConcurrency,
    });
    const edgeManager = new EdgeManager();

    taskRunner.on(TaskRunner.TASK_FINISH, (projectName: string) => {
      const projectNode = this.getNodeData(projectName) as IProjectNode;
      const dependent = projectNode.dependent || [];

      for (const dependentProject of dependent) {
        // 只处理在叶子节点/目标项目的所有依赖集合的节点
        if (
          ![traverseTargetNode, ...leafNodes].some(
            n => n.name === dependentProject.name,
          )
        ) {
          continue;
        }

        edgeManager.reduceOneEdge(dependentProject);

        if (dependentProject.name === traverseTargetNode.name && !withSelf) {
          continue;
        }

        // 变成叶子节点，就加入执行任务的队列中
        if (edgeManager.getEdge(dependentProject) === 0) {
          taskRunner.addTask(this._createTask(dependentProject, task));
        }
      }
    });

    await taskRunner.run();
  }

  /**
   * Copyright (c) Microsoft Corporation. All rights reserved.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file at
   * https://github.com/microsoft/rushstack/blob/master/apps/rush-lib/LICENSE
   *
  /**
   * Checks for projects that indirectly depend on themselves.
   */
  private _checkForCyclicDependencies(
    projects: Iterable<IProjectNode>,
    dependencyChain: string[],
    alreadyCheckedProjects: Set<string>,
  ): void {
    for (const project of projects) {
      if (dependencyChain.includes(project.name)) {
        throw new Error(
          `${'A cyclic dependency was encountered:\n'}    ${[
            ...dependencyChain,
            project.name,
          ]
            .reverse()
            .join('\n  -> ')}\n`,
        );
      }

      if (!alreadyCheckedProjects.has(project.name)) {
        alreadyCheckedProjects.add(project.name);
        dependencyChain.push(project.name);
        this._checkForCyclicDependencies(
          project.dependent!,
          dependencyChain,
          alreadyCheckedProjects,
        );
        dependencyChain.pop();
      }
    }
  }

  private _getDependencyLeafNodes(node: IProjectNode) {
    const dependency = node.dependency as IProjectNode[];
    if (dependency.length === 0) {
      return [];
    }

    let leafNodes: IProjectNode[] = [...dependency];

    for (const dependencyNode of dependency) {
      leafNodes = [
        ...leafNodes,
        ...this._getDependencyLeafNodes(dependencyNode),
      ];
    }

    return leafNodes;
  }

  private readonly _createTask =
    (project: IProjectNode, task: Task): TaskFunType<string> =>
    async (stopTask = () => undefined) => {
      await task(project, project.dependency || [], () => stopTask());
      return project.name;
    };

  private _getProjectPreviousNode(
    searchProjects: IProjectNode[],
    preNodes: IProjectNode[],
  ) {
    return searchProjects.filter(p =>
      preNodes.map(preP => preP.name).includes(p.name),
    );
  }

  // public async getOrderTasks() {
  //     // Precalculate the number of dependent packages
  //   for (const project of this._projects) {
  //     calculateCriticalPaths(project);
  //   }
  // }
}
