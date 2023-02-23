import { IProjectNode } from '../projects/getProjects';
import { create } from './create';
import { DagOperator } from './operator';

export const initDAG = (projects: IProjectNode[]) => {
  const { projectsMap } = create(projects);
  const operator = new DagOperator(projects, projectsMap);
  return operator;
};
