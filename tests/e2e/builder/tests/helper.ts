import { test } from '@modern-js/e2e/playwright';

const providerType = process.env.PROVIDE_TYPE || 'webpack';

export const getProviderTest = (supportType: string[] = ['webpack']) => {
  if (supportType.includes(providerType)) {
    return test;
  }

  const testSkip = test.skip;

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  testSkip.describe = test.describe.skip;
  return testSkip as typeof test.skip & {
    describe: typeof test.describe.skip;
  };
};

export const webpackOnlyTest = getProviderTest(['webpack']);
export const rspackOnlyTest = getProviderTest(['rspack']);
export const allProviderTest = getProviderTest(['webpack', 'rspack']);
