import { mountHook } from '@modern-js/core';

export const deploy = async () => {
  await (mountHook() as any).beforeDeploy();
  await (mountHook() as any).afterDeploy();
};
