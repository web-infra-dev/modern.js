import type { AsyncHook } from '../hooks';

export type ModifyConfigFn<ServerConfig> = (
  arg: ServerConfig,
) => ServerConfig | Promise<ServerConfig>;

export type OnPrepareFn = () => Promise<void> | void;

export type ChangeEvent = 'add' | 'change' | 'unlink';

export interface Change {
  filename: string;
  event: ChangeEvent;
}

export interface RepackEvent {
  type: 'repack';
}

export interface FileChangeEvent {
  type: 'file-change';
  payload: Change[];
}

export type ResetEvent = RepackEvent | FileChangeEvent;

export type OnResetFn = (params: {
  event: ResetEvent;
}) => Promise<void> | void;

export type Hooks<ServerConfig> = {
  modifyConfig: AsyncHook<ModifyConfigFn<ServerConfig>>;
  onPrepare: AsyncHook<OnPrepareFn>;
  onReset: AsyncHook<OnResetFn>;
};
