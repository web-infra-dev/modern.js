import type { Command } from '@modern-js/utils/commander';

export type ConfigFn<Config> = () => Config;

export type ModifyConfigFn<Config> = (config: Config) => Config;

export type ModifyResolvedConfigFn<NormalizedConfig> = (
  config: NormalizedConfig,
) => NormalizedConfig;

type IPartialMethod = (...script: string[]) => void;
export interface PartialMethod {
  append: IPartialMethod;
  prepend: IPartialMethod;
}

export type ModifyHtmlPartialsFn<Entrypoint> = (params: {
  entrypoint: Entrypoint;
  partials: {
    top: PartialMethod;
    head: PartialMethod;
    body: PartialMethod;
  };
}) => Promise<void> | void;

export type AddCommandFn = (params: { program: Command }) => void;

export type OnPrepareFn = () => Promise<void> | void;

export type OnWatchFilesFn = () => Promise<
  Array<string | { files: string[]; isPrivate: boolean }>
>;

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

export type OnBeforeDeployFn = () => Promise<void> | void;

export type OnAfterDeployFn = () => Promise<void> | void;

export type OnBeforeExitFn = () => void;
