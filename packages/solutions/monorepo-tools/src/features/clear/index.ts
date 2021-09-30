import * as path from 'path';
import { logger } from '@modern-js/utils';
import { FileSystem } from '@rushstack/node-core-library';
import { IProjectNode } from '../../projects/get-projects';

export interface IClearConfig {
  rootPath: string;
  removeDirs?: string[];
}

export const defaultRemoveDirs = ['node_modules'];

export const runClearTask = (
  projectNames: string[],
  projects: IProjectNode[],
  config: IClearConfig,
) => {
  const { removeDirs = defaultRemoveDirs, rootPath } = config;
  if (projectNames.length > 0) {
    projects.forEach(project => {
      if (projectNames.includes(project.name)) {
        removeDirs.forEach(dir => {
          const removePath = path.join(`${project.extra.path}`, dir);
          logger.info(`remove ${removePath}`);
          FileSystem.deleteFolder(removePath);
        });
      }
    });
  } else {
    removeDirs.forEach(dir => {
      const removePath = path.join(`${rootPath}`, dir);
      logger.info(`remove ${removePath}`);
      FileSystem.deleteFolder(removePath);
    });
    projects.forEach(project => {
      removeDirs.forEach(dir => {
        const removePath = path.join(`${project.extra.path}`, dir);
        logger.info(`remove ${removePath}`);
        FileSystem.deleteFolder(removePath);
      });
    });
  }
};
