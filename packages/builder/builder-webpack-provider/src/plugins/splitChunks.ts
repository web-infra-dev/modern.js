import assert from 'assert';
import {
  RUNTIME_CHUNK_NAME,
  getPackageNameFromModulePath,
} from '@modern-js/builder-shared';

import type { BuilderPlugin } from '../types';
import type {
  BuilderChunkSplit,
  SplitChunks,
  CacheGroup,
} from '../types/config/performance';
import type { Module } from 'webpack';

// We expose the three-layer to specify webpack chunk-split ability:
// 1. By strategy.There some best pratice integrated in our internal strategy.
// 2. By forceSplitting config, which is designed to split chunks by user defined rules.That's easier to use than webpack raw config.
// 3. By override config, which is designed to override the raw config of webpack `splitChunks`.It has the highest priority.
// By the way, the config complexity is increasing gradually.

interface SplitChunksContext {
  /**
   * User defined cache groups which can be reused across different split strategies
   */
  userDefinedCacheGroups: CacheGroup;
  /**
   * Default split config in webpack
   */
  defaultConfig: SplitChunks;
  /**
   * User webpack `splitChunks` config
   */
  override: SplitChunks;
  /**
   * User builder `chunkSplit` cpnfig
   */
  builderConfig: BuilderChunkSplit;
}

function getUserDefinedCacheGroups(forceSplitting: Array<RegExp>): CacheGroup {
  const cacheGroups: CacheGroup = {};
  forceSplitting.forEach((reg, index) => {
    const key = `User_Force_Split_Group_${index}`;

    cacheGroups[key] = {
      test: reg,
      name: key,
      chunks: 'all',
      // Ignore minimum size, minimum chunks and maximum requests and always create chunks for user defined cache group.
      enforce: true,
    };
  });
  return cacheGroups;
}

function splitByExperience(ctx: SplitChunksContext): SplitChunks {
  const { override, userDefinedCacheGroups, defaultConfig } = ctx;
  const experienceCacheGroup: CacheGroup = {};
  const SPLIT_EXPERIENCE_LIST = [
    /[\\/]react|react-dom[\\/]/,
    /[\\/]react-router|react-router-dom|history[\\/]/,
    /[\\/]@ies\/semi[\\/]/,
    /[\\/]antd[\\/]/,
    /[\\/]@arco-design[\\/]/,
    /[\\/]@douyinfe\/semi[\\/]/,
    /[\\/]@babel\/runtime|@babel\/runtime-corejs2|@babel\/runtime-corejs3[\\/]/,
    /[\\/]lodash|lodash-es[\\/]/,
    /[\\/]core-js[\\/]/,
  ];

  SPLIT_EXPERIENCE_LIST.forEach((test: RegExp, index: number) => {
    const key = `pre-defined-chunk-${index}`;

    experienceCacheGroup[key] = {
      test,
      priority: 0,
      name: key,
      reuseExistingChunk: true,
    };
  });
  assert(defaultConfig !== false);
  assert(override !== false);
  return {
    ...defaultConfig,
    ...override,
    cacheGroups: {
      ...defaultConfig.cacheGroups,
      ...experienceCacheGroup,
      ...userDefinedCacheGroups,
      ...override.cacheGroups,
    },
  };
}

function splitByModule(ctx: SplitChunksContext): SplitChunks {
  const { override, userDefinedCacheGroups, defaultConfig } = ctx;
  assert(defaultConfig !== false);
  assert(override !== false);
  return {
    ...defaultConfig,
    minSize: 0,
    maxInitialRequests: Infinity,
    ...override,
    cacheGroups: {
      ...defaultConfig.cacheGroups,
      ...userDefinedCacheGroups,
      // Core group
      vendors: {
        priority: -10,
        test: /[\\/]node_modules[\\/]/,
        name(module: Module): string | false {
          return getPackageNameFromModulePath(module.context!);
        },
      },
      ...override.cacheGroups,
    },
  };
}

function splitBySize(ctx: SplitChunksContext): SplitChunks {
  const { override, userDefinedCacheGroups, defaultConfig, builderConfig } =
    ctx;
  assert(defaultConfig !== false);
  assert(override !== false);
  assert(builderConfig.strategy === 'split-by-size');
  return {
    ...defaultConfig,
    minSize: builderConfig.minSize ?? 0,
    maxSize: builderConfig.maxSize ?? Infinity,
    ...override,
    cacheGroups: {
      ...defaultConfig.cacheGroups,
      ...userDefinedCacheGroups,
      ...override.cacheGroups,
    },
  };
}

function splitCustom(ctx: SplitChunksContext): SplitChunks {
  const { override, userDefinedCacheGroups, defaultConfig } = ctx;
  assert(defaultConfig !== false);
  assert(override !== false);
  return {
    ...defaultConfig,
    ...override,
    cacheGroups: {
      ...defaultConfig.cacheGroups,
      ...userDefinedCacheGroups,
      ...override.cacheGroups,
    },
  };
}

function allInOne(_ctx: SplitChunksContext): SplitChunks {
  // Set false to avoid chunk split.
  return false;
}

// Ignore user defined cache group to get single vendor chunk.
function singleVendor(ctx: SplitChunksContext): SplitChunks {
  const { override, defaultConfig } = ctx;
  assert(defaultConfig !== false);
  assert(override !== false);
  return {
    ...defaultConfig,
    ...override,
    cacheGroups: {
      ...defaultConfig.cacheGroups,
      ...override.cacheGroups,
    },
  };
}

const SPLIT_STRATEGY_DISPATCHER: Record<
  string,
  (ctx: SplitChunksContext) => SplitChunks
> = {
  'split-by-experience': splitByExperience,
  'split-by-module': splitByModule,
  'split-by-size': splitBySize,
  custom: splitCustom,
  'all-in-one': allInOne,
  'single-vendor': singleVendor,
};

export function PluginSplitChunks(): BuilderPlugin {
  return {
    name: 'builder-plugin-split-chunks',
    setup(api) {
      api.modifyWebpackChain(chain => {
        const config = api.getNormalizedConfig();
        const defaultConfig: SplitChunks = {
          // Optimize both `initial` and `async` chunks
          chunks: 'all',
          // When chunk size >= 50000 bytes, split it into separate chunk
          enforceSizeThreshold: 50000,
          cacheGroups: {},
        };
        const { chunkSplit } = config.performance;
        let userDefinedCacheGroups = {};
        if (chunkSplit.forceSplitting) {
          userDefinedCacheGroups = getUserDefinedCacheGroups(
            chunkSplit.forceSplitting,
          );
        }
        // Patch the override config difference between the `custom` strategy and other strategy.
        const override =
          chunkSplit.strategy === 'custom'
            ? chunkSplit.splitChunks
            : chunkSplit.override;
        // Apply different strategy
        const splitChunksOptions = SPLIT_STRATEGY_DISPATCHER[
          chunkSplit.strategy
        ]({
          defaultConfig,
          override: override || {},
          userDefinedCacheGroups,
          builderConfig: chunkSplit,
        });

        chain.optimization.splitChunks(splitChunksOptions);

        // should not extract runtime chunk when strategy is `all-in-one`
        if (chunkSplit.strategy !== 'all-in-one') {
          chain.optimization.runtimeChunk({
            name: RUNTIME_CHUNK_NAME,
          });
        }
      });
    },
  };
}
