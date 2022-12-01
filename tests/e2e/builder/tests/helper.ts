import { test } from '@modern-js/e2e/playwright';

const providerType = process.env.PROVIDE_TYPE || 'webpack';

export const getProviderTest = (supportType: string[] = ['webpack']) => {
  if (supportType.includes(providerType)) {
    return test;
  }
  return test.skip;
};

export const webpackOnlyTest = getProviderTest(['webpack']);
export const rspackOnlyTest = getProviderTest(['rspack']);
export const allProviderTest = getProviderTest(['webpack', 'rspack']);
