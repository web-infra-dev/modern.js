import type { NormalizedConfig } from '@modern-js/core';
import build from '../compiler';
import { MODE } from '../contants';
import server from './server';

export default async (
  appDirectory: string,
  internalDirectory: string,
  webpackConfig: any,
  modernConfig: NormalizedConfig,
  type = MODE.BLOCK,
) => {
  // 构建本地editor产物
  await build(webpackConfig, {
    appDirectory,
    internalDirectory,
    isDev: true,
    type,
  });
  // 启动调试服务
  server({ appDirectory, internalDirectory, mode: type });
};

export { close } from './server';
