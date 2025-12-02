import { createServerBase } from '../src';

export function getDefaultConfig() {
  return {
    html: {},
    output: {},
    source: {},
    tools: {},
    server: {},
    bff: {},
    dev: {},
    security: {},
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
