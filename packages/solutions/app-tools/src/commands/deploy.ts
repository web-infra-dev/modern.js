import { mountHook } from '@modern-js/core';

export const deploy = async (options: any) => {
  await mountHook().beforeDeploy(options);
  await mountHook().afterDeploy(options);
};
