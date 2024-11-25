import type { Command } from '@modern-js/utils/commander';
import type { TransformFunction } from '../plugin';
import type { Entrypoint } from './context';

declare module '@modern-js/utils/commander' {
  export interface Command {
    commandsMap: Map<string, Command>;
  }
}
export type ConfigFn<Config> = () => Config;

export type ModifyConfigFn<Config> = TransformFunction<Config>;

export type ModifyResolvedConfigFn<NormalizedConfig> =
  TransformFunction<NormalizedConfig>;

type IPartialMethod = (...script: string[]) => void;
export interface PartialMethod {
  append: IPartialMethod;
  prepend: IPartialMethod;
}

export type ModifyHtmlPartialsFn = (params: {
  entrypoint: Entrypoint;
  partials: {
    top: PartialMethod;
    head: PartialMethod;
    body: PartialMethod;
  };
}) => Promise<void> | void;

export type AddCommandFn = (params: { program: Command }) => void;

export type OnPrepareFn = () => Promise<void> | void;

type WatchFilesReturnType =
  | Array<string>
  | { files: string[]; isPrivate: boolean };
export type AddWatchFilesFn = () =>
  | WatchFilesReturnType
  | Promise<WatchFilesReturnType>;

export type OnFileChangedFn = (params: {
  filename: string;
  eventType: 'add' | 'change' | 'unlink';
  isPrivate: boolean;
}) => void;

export type OnBeforeRestartFn = () => Promise<void> | void;

export type OnBeforeDevFn = () => Promise<void> | void;

export type OnAfterDevFn = (params: {
  isFirstCompile: boolean;
}) => Promise<void> | void;

export type OnBeforeDeployFn = (
  options: Record<string, any>,
) => Promise<void> | void;

export type OnAfterDeployFn = (
  options: Record<string, any>,
) => Promise<void> | void;

export type OnBeforeExitFn = () => void;
