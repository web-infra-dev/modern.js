import { PluginRunner, runtime } from './base';

let globalRunner: PluginRunner;

export function setGlobalRunner(runner: PluginRunner) {
  globalRunner = runner;
}

export function getGlobalRunner() {
  if (globalRunner) {
    return globalRunner;
  }
  const runner = runtime.init();
  setGlobalRunner(runner);
  return runner;
}
