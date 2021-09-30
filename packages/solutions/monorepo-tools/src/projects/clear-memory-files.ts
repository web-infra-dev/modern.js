import * as path from 'path';
import { FileSystem } from '@rushstack/node-core-library';
import { IProjectNode } from './get-projects';
import {
  PROJECT_MEMORY_PATH,
  PROJECT_CONTENT_FILE_NAME,
} from './check-project-change';

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
