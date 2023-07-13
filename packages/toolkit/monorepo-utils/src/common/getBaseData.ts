import path from 'path';
import type { MonorepoAnalyzer } from '../types';
import { isMonorepo, IsMonorepoFn } from './isMonorepo';
import type { GetProjectsFunc } from './getProjects';

export interface IMonorepoBaseData {
  isMonorepo: boolean;
  type: string;
  rootPath: string;
  getProjects?: GetProjectsFunc;
}

export const getMonorepoBaseData = async (
  starFindPath: string,
  otherMonrepoAnalyzer?: Record<string, MonorepoAnalyzer>,
): Promise<IMonorepoBaseData> => {
  let repoIsMonorepo = false;
  let findPath = starFindPath;
  let type = '';
  let otherMonrepoChecks: Record<string, IsMonorepoFn> | undefined;
  if (otherMonrepoAnalyzer) {
    otherMonrepoChecks = otherMonrepoChecks ?? {};
    for (const [monoType, analyer] of Object.entries(otherMonrepoAnalyzer)) {
      otherMonrepoChecks[monoType] = analyer.check;
    }
  }

  while (true) {
    const result = await isMonorepo(findPath, otherMonrepoChecks);
    if (result.isMonorepo) {
      repoIsMonorepo = true;
      ({ type } = result);
      break;
    }

    // find system root path
    if (findPath === path.dirname(findPath)) {
      break;
    }

    findPath = path.dirname(findPath);
  }

  return {
    isMonorepo: repoIsMonorepo,
    rootPath: repoIsMonorepo ? findPath : '',
    type,
    getProjects: otherMonrepoAnalyzer?.[type]?.getProjects,
  };
};
