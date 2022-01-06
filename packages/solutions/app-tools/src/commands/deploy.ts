import { mountHook } from '@modern-js/core';

export const deploy = async (options: any) => {
  await (mountHook() as any).beforeDeploy(options);
  await (mountHook() as any).afterDeploy(options);
};
