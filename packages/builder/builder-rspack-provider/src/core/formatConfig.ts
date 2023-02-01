import type { RspackConfig } from '../types';
import type { BundlerConfig } from '@modern-js/builder-shared';
import { difference, omitBy, isUndefined } from '@modern-js/utils/lodash';
import { BUILTIN_LOADER } from '../shared';

const formatCondition = (data: any, typeName: string): string | RegExp => {
  if (!(data instanceof RegExp || typeof data === 'string')) {
    throw new Error(
      `${typeName} only support string or RegExp, but found ${typeof data}`,
    );
  }
  return data;
};

const formatConditionWithUndefined = (
  data: any,
  typeName: string,
): string | RegExp | undefined => {
  if (typeof data === 'undefined') {
    return data;
  }
  return formatCondition(data, typeName);
};

type RspackRule = NonNullable<NonNullable<RspackConfig['module']>['rules']>[0];

type BundlerRule = NonNullable<
  NonNullable<BundlerConfig['module']>['rules']
>[0];

const whiteListKeys = [
  'test',
  'include',
  'exclude',
  'resource',
  'resourceQuery',
  'use',
  'type',
  'parser',
  'generator',
  'issuer',
];

export const formatRule = (rule: BundlerRule): RspackRule => {
  if (rule === '...') {
    throw new Error(`${rule} not supported in bundlerChain.rule`);
  }

  const ruleKeys = Object.keys(rule);

  const usedBlackList = difference(ruleKeys, whiteListKeys);

  if (usedBlackList.length) {
    throw new Error(
      `${usedBlackList.join(',')} is not supported in bundlerChain.rule`,
    );
  }

  const formatRuleUse = (use: typeof rule['use']) => {
    if (!use) {
      return undefined;
    }

    if (!Array.isArray(use)) {
      throw new Error(`only support array in rule.use`);
    }

    return use.map(content => {
      if (typeof content === 'function') {
        throw new Error(`only support array or string in rule.use`);
      }

      if (typeof content === 'string') {
        return {
          loader: content,
        };
      }

      if (!content.loader) {
        throw new Error(`loader is required in rule.use`);
      }

      if (content.loader.includes(BUILTIN_LOADER)) {
        const { loader, ...loaderConfig } = content;
        return {
          ...loaderConfig,
          builtinLoader: loader.replace(BUILTIN_LOADER, ''),
        };
      }

      return {
        ...content,
        loader: content.loader,
      };
    });
  };

  return omitBy(
    {
      ...rule,
      type: rule.type as RspackRule['type'],
      use: formatRuleUse(rule.use),
      resource: formatConditionWithUndefined(rule.resource, 'resource'),
      resourceQuery: formatConditionWithUndefined(
        rule.resourceQuery,
        'resourceQuery',
      ),
      exclude: Array.isArray(rule.exclude)
        ? rule.exclude.map(e => formatCondition(e, 'exclude'))
        : formatConditionWithUndefined(rule.exclude, 'exclude'),
      include: Array.isArray(rule.include)
        ? rule.include.map(i => formatCondition(i, 'include'))
        : formatConditionWithUndefined(rule.include, 'include'),
      test: formatConditionWithUndefined(rule.test, 'test'),
    },
    isUndefined,
  );
};

type BundlerSplitChunks = NonNullable<
  BundlerConfig['optimization']
>['splitChunks'];

type RspackSplitChunks = NonNullable<
  RspackConfig['optimization']
>['splitChunks'];

const formatSplitSize = (data: any, typeName: string): number | undefined => {
  if (typeof data === 'undefined') {
    return data;
  }
  if (!(typeof data === 'number')) {
    throw new Error(
      `${typeName} only support number, but found ${typeof data}: ${JSON.stringify(
        data,
      )}`,
    );
  }

  return data;
};

export const formatSplitChunks = (
  splitChunks?: BundlerSplitChunks,
): RspackSplitChunks => {
  if (!splitChunks) {
    return undefined;
  }

  if (splitChunks.chunks instanceof Function) {
    throw new Error(`chunks not support Function`);
  }

  const formatCacheGroups = (
    cacheGroups?: NonNullable<typeof splitChunks['cacheGroups']>,
  ) => {
    if (!cacheGroups) {
      return cacheGroups;
    }
    Object.values(cacheGroups).forEach(c => {
      if (!(c instanceof Object)) {
        throw new Error(`cacheGroups only support object`);
      }
    });

    return cacheGroups as NonNullable<RspackSplitChunks>['cacheGroups'];
  };

  return {
    ...splitChunks,
    minSizeReduction: formatSplitSize(
      splitChunks.minSizeReduction,
      'minSizeReduction',
    ),
    minRemainingSize: formatSplitSize(
      splitChunks.minRemainingSize,
      'minRemainingSize',
    ),
    maxSize: formatSplitSize(splitChunks.maxSize, 'maxSize'),
    minSize: formatSplitSize(splitChunks.minSize, 'minSize'),
    maxInitialSize: formatSplitSize(
      splitChunks.maxInitialSize,
      'maxInitialSize',
    ),
    maxAsyncSize: formatSplitSize(splitChunks.maxAsyncSize, 'maxAsyncSize'),
    enforceSizeThreshold: formatSplitSize(
      splitChunks.enforceSizeThreshold,
      'enforceSizeThreshold',
    ),
    chunks: splitChunks.chunks,
    cacheGroups: formatCacheGroups(splitChunks.cacheGroups),
  };
};
