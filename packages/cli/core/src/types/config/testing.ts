import type { JestConfigTypes, Merge } from '@modern-js/types';

export type Jest = JestConfigTypes.InitialOptions;
export type BaseJestUserConfig = Jest | ((jestConfig: Jest) => Jest);

// eslint-disable-next-line @typescript-eslint/ban-types
export type BaseTestingUserConfig<ExtendTestingUserConfig = {}> = Merge<
  {
    /**
     * Decide which transformer will be used to compile file
     * Default: babel-jest
     */
    transformer?: 'babel-jest' | 'ts-jest';

    /**
     * Original jest config
     * Doc: https://jestjs.io/docs/configuration
     */
    jest?: BaseJestUserConfig;
  },
  ExtendTestingUserConfig
>;

// eslint-disable-next-line @typescript-eslint/ban-types
export type BaseTestingNormalizedConfig<ExtendTestingNormailzedConfig = {}> =
  BaseTestingUserConfig<ExtendTestingNormailzedConfig>;
