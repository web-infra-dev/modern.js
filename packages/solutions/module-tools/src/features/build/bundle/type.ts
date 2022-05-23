import { BuildConfig } from '../type';
export type BundleBuildConfig = {
    appDirectory: string;
} & Required<BuildConfig>;
