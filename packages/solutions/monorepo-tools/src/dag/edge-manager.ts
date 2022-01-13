import { IProjectNode } from '../projects/get-projects';

export class EdgeManager {
  private _dependencyEdgeHash: Record<string, number>;

  constructor() {
    this._dependencyEdgeHash = {};
  }

  reduceOneEdge(project: IProjectNode) {
    if (!(project.name in this._dependencyEdgeHash)) {
      this._dependencyEdgeHash[project.name] = project.dependencyEdge;
    }

    this._dependencyEdgeHash[project.name]--;
  }

  reduceEdges(project: IProjectNode, edges: number) {
    if (!(project.name in this._dependencyEdgeHash)) {
      this._dependencyEdgeHash[project.name] = project.dependencyEdge;
    }

    this._dependencyEdgeHash[project.name] -= edges;
  }

  getEdge(project: IProjectNode) {
    if (project.name in this._dependencyEdgeHash) {
      return this._dependencyEdgeHash[project.name];
    }

    return NaN;
  }

  setEdge(project: IProjectNode) {
    this._dependencyEdgeHash[project.name] = project.dependencyEdge;
  }
}
