import { IsMonorepoFn } from './isMonorepo';
import { GetProjectsFunc } from './getProjects';

export interface MonorepoAnalyzer {
  check: IsMonorepoFn;
  getProjects: GetProjectsFunc;
}
