import * as path from 'path';
import { FileSystem, JsonFile, Sort } from '@rushstack/node-core-library';
import { getGitHashForFiles } from '@rushstack/package-deps-hash';
import { globby } from '@modern-js/utils';
import md5 from 'md5';
import { IProjectNode } from './get-projects';

export const PROJECT_CONTENT_FILE_NAME = 'project-content.json';
export const MONOREPO_GIT_FILE_NAME = 'monorepo-git.json';
export const PROJECT_MEMORY_PATH = '.project-memory';

const getProjectGitHash = async (project: IProjectNode) => {
  const projectDir = project.extra.path;
  const globOption: any = {
    cwd: projectDir,
    absolute: true,
    expandDirectories: false,
    followSymbolicLinks: false,
    ignore: ['**/node_modules/**', '.project-memory/**', 'dist/**'],
  };
  const globPattern = `${projectDir}/**`;

  const files = await globby(path.posix.join(globPattern), globOption);
  const hashMap = getGitHashForFiles(files as any[], projectDir);

  const hashObject: Record<string, string> = {};

  // sort is important
  Sort.sortMapKeys(hashMap);
  hashMap.forEach((value, key) => {
    hashObject[key] = value;
  });

  return md5(JsonFile.stringify(hashObject));
};

export const checkProjectChangeByGit = async (
  project: IProjectNode,
  rootPath: string,
) => {
  const monorepoGitMemory = path.join(rootPath, MONOREPO_GIT_FILE_NAME);

  const currentProjectHash = await getProjectGitHash(project);

  if (!FileSystem.exists(monorepoGitMemory)) {
    FileSystem.writeFile(monorepoGitMemory, JsonFile.stringify({}), {
      ensureFolderExists: true,
    });
  }

  const monorepoProjectHashJson = JsonFile.load(monorepoGitMemory);
  const changed = monorepoProjectHashJson[project.name] !== currentProjectHash;
  if (changed) {
    monorepoProjectHashJson[project.name] = currentProjectHash;
    FileSystem.writeFile(
      monorepoGitMemory,
      JsonFile.stringify(monorepoProjectHashJson),
      { ensureFolderExists: true },
    );
  }

  return changed;
};

const getProjectContentHashObjectForFiles = async (project: IProjectNode) => {
  const projectDir = project.extra.path;
  const globOption: any = {
    cwd: projectDir,
    absolute: true,
    expandDirectories: false,
    followSymbolicLinks: false,
    ignore: ['**/node_modules/**', '.project-memory/**', '**/dist/**'],
  };
  const globPattern = `${projectDir}/**`;

  const files = await globby(path.posix.join(globPattern), globOption);

  const hashObject: Record<string, string> = {};
  // sort is important
  for (const file of files.sort()) {
    hashObject[file as any] = md5(FileSystem.readFile(file as any));
  }

  return hashObject;
};

export const checkProjectChangeByContent = async (project: IProjectNode) => {
  const projectDir = project.extra.path;
  const projectMemoryFolder = path.resolve(projectDir, '.project-memory');
  const projectJsonFile = path.join(
    projectMemoryFolder,
    PROJECT_CONTENT_FILE_NAME,
  );

  const currentHashObject = await getProjectContentHashObjectForFiles(project);
  const currentHashString = JsonFile.stringify(currentHashObject);

  if (!FileSystem.exists(projectJsonFile)) {
    FileSystem.writeFile(projectJsonFile, currentHashString, {
      ensureFolderExists: true,
    });
    return true;
  }

  const localHashObject = JsonFile.load(projectJsonFile);
  const changed = JsonFile.stringify(localHashObject) !== currentHashString;

  if (changed) {
    FileSystem.writeFile(projectJsonFile, currentHashString, {
      ensureFolderExists: true,
    });
  }

  return changed;
};
