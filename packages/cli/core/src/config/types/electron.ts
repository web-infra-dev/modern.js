import { TransformOptions } from '@babel/core';
import { Configuration } from 'electron-builder';

export type BuildConfig = {
  baseConfig: Configuration;
  macConfig?: Configuration;
  winConfig?: Configuration;
  win64Config?: Configuration;
  linuxConfig?: Configuration;
};

export type ElectronConfig = {
  builder?: BuildConfig;
  babel?:
    | TransformOptions
    | ((defaultBabelConfig: TransformOptions) => TransformOptions);
};
