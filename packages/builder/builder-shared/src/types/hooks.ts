import type { Stats, MultiStats } from './stats';
import { SharedBuilderConfig } from './config';

export type OnBeforeBuildFn<T extends SharedBuilderConfig> = (params: {
  bundlerConfigs: T[];
}) => Promise<void> | void;

export type OnAfterBuildFn = (params: {
  stats?: Stats | MultiStats;
}) => Promise<void> | void;

export type OnDevCompileDoneFn = (params: {
  isFirstCompile: boolean;
}) => Promise<void> | void;

export type OnBeforeStartDevServerFn = () => Promise<void> | void;

export type OnAfterStartDevServerFn = (params: {
  port: number;
}) => Promise<void> | void;

export type OnExitFn = () => void;
