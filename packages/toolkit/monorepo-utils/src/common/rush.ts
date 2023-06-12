import { RushConfiguration } from '@microsoft/rush-lib';
import { Project } from '../project/project';

export const getProjects = async (monorepoRoot: string): Promise<Project[]> => {
  const rushConfiguration = RushConfiguration.loadFromDefaultLocation({
    startingFolder: monorepoRoot,
  });
  const { projects } = rushConfiguration;
  return projects.map(p => new Project(p.packageName, p.projectFolder));
};
