import type { JscTarget, ModuleConfig } from '@modern-js/swc-plugins';

export const getSwcTarget = (target: string): JscTarget => {
  // refer to JscTarget
  const list = ['es3', 'es5', 'es2015', 'es2016', 'es2017', 'es2018', 'es2019', 'es2020', 'es2021', 'es2022'];
  if (list.includes(target)) {
    return target as JscTarget;
  }

  if (target === 'next') {
    return 'es2022';
  }

  if (target === 'es6') {
    return 'es2015';
  }

  return 'es2022';
};

export const getModuleConfig = (format: 'esm' | 'cjs' | 'iife'): ModuleConfig | undefined => {
  if (format === 'cjs') {
    return {
      type: 'commonjs',
      // Although swc can output `0 && module.exports = xxx` code, esbuild will remove it
      // importInterop: 'node',
    };
  }

  if (format === 'esm') {
    return { type: 'es6' };
  }

  return undefined;
};
