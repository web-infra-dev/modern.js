import path from 'path';
import { Project } from '../project/project';
import { readRushJson } from '../utils';

export const getProjects = async (monorepoRoot: string): Promise<Project[]> => {
  const rushConfiguration = await readRushJson(monorepoRoot);
  const { projects = [] } = rushConfiguration;
  return Promise.all(
    projects.map(async p => {
      const project = new Project(
        p.packageName,
        path.join(monorepoRoot, p.projectFolder),
      );
      await project.init();
      return project;
    }),
  );
};
