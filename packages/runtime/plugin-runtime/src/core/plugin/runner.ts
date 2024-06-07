import { PluginRunner } from './base';

let globalRunner: PluginRunner;

export function setGlobalRunner(runner: PluginRunner) {
  globalRunner = runner;
}

export function getGlobalRunner() {
  return globalRunner;
}
