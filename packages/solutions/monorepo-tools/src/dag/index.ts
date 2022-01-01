import { create } from './create';
import { DagOperator } from './operator';
import { IProjectNode } from '../projects/get-projects';

export const initDAG = (projects: IProjectNode[]) => {
  const { projectsMap } = create(projects);
  const operator = new DagOperator(projects, projectsMap);
  return operator;
};
