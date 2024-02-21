import { createServerBase } from '@base/index';

export function getDefaultConfig() {
  return {
    html: {},
    output: {},
    source: {},
    tools: {},
    server: {},
    runtime: {},
    bff: {},
  };
}

export function getDefaultAppContext() {
  return {
    apiDirectory: '',
    lambdaDirectory: '',
  };
}

export function createDefaultServer() {
  const server = createServerBase({
    config: getDefaultConfig(),
    appContext: getDefaultAppContext(),
    pwd: '',
  });

  return server;
}
