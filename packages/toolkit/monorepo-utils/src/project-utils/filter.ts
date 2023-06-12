import type { Project } from '../project/project';

export type Filter = FilterFunction;
export type FilterFunction = (
  projects: Project[],
) => Project[] | Promise<Project[]>;

export const defaultFilter: FilterFunction = projects => projects;

export const filterByField =
  (fieldName: string): FilterFunction =>
  (projects: Project[]) => {
    return projects.filter(p => fieldName in p.metaData);
  };
