import { UserConfig } from "@speedy-js/speedy-types";

export type Format = 'esm' | 'cjs' | 'iife';

export type Target =
  | 'es6'
  | 'es5'
  | 'es2015'
  | 'es2016'
  | 'es2017'
  | 'es2018'
  | 'es2019'
  | 'es2020'
  | 'esnext';

export type BuildConfig = {
    tsconfig?: string;
    watch?: boolean;
    dts?: boolean;
    bundle?: boolean;
    format?: Format[];
    target?: Target;
    bundleOption?: {
        entry?: string;
    } & UserConfig;
};

export type BuildPreset = BuildConfig[] | BuildConfig | 'library' | 'component'
