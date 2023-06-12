import { readProjects } from '@pnpm/filter-workspace-packages';
import { Project } from '../project/project';

export const getProjects = async (monorepoRoot: string): Promise<Project[]> => {
  const { allProjects } = await readProjects(monorepoRoot, []);
  return allProjects
    .filter(p => p.manifest.name)
    .map(p => new Project(p.manifest.name as string, p.dir));
};
