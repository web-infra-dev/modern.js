import { IProjectNode } from '../../projects/getProjects';

// TODO: 第一个参数是否也需要为一个string[]
export type BuildWatchCmdsType =
  | [string]
  | [string, string]
  | [string, (project: IProjectNode) => string[]];

export const defaultBuildWatchCmds: BuildWatchCmdsType = ['dev', 'build'];
