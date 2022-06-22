import { defaultsConfig } from '@modern-js/core';
import type WebpackChain from '@modern-js/utils/webpack-chain';

export const userConfig = {
  ...defaultsConfig,
};

export const isPluginRegistered = (chain: WebpackChain, pluginId: string) => {
  try {
    chain.plugin(pluginId).tap(options => options);
    return true;
  } catch {
    return false;
  }
};

export const mockNodeEnv = (value: string) => {
  const { NODE_ENV } = process.env;
  process.env.NODE_ENV = value;

  return function restore() {
    process.env.NODE_ENV = NODE_ENV;
  };
};

export const setPathSerializer = () => {
  const formatWindowsPath = (val: string) => val.replace(/\\/g, '/');

  expect.addSnapshotSerializer({
    test: val => typeof val === 'string' && val.includes('node_modules'),
    print: val =>
      formatWindowsPath((val as string).split('node_modules').pop()!),
  });

  expect.addSnapshotSerializer({
    test: val => typeof val === 'string' && val.includes('packages'),
    print: val => formatWindowsPath((val as string).split('packages').pop()!),
  });
};
