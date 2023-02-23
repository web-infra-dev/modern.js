import * as path from 'path';
import { FileSystem } from '@rushstack/node-core-library';
import { IProjectNode } from './getProjects';
import {
  PROJECT_MEMORY_PATH,
  PROJECT_CONTENT_FILE_NAME,
} from './checkProjectChange';

export const clearProjectsMemoryFile = (projects: IProjectNode[]) => {
  for (const project of projects) {
    const memoryFilePath = path.join(
      project.extra.path,
      PROJECT_MEMORY_PATH,
      PROJECT_CONTENT_FILE_NAME,
    );
    console.info('remove', memoryFilePath);
    FileSystem.deleteFile(memoryFilePath);
  }
};
