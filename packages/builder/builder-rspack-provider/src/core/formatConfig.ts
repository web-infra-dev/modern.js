import type { RspackConfig, RspackRule } from '../types';

import type { BundlerConfig } from '@modern-js/builder-shared';
import { omitBy, isUndefined } from '@modern-js/utils/lodash';

const formatCondition = (data: any, typeName: string): string | RegExp => {
  if (
    !(
      data instanceof RegExp ||
      typeof data === 'string' ||
      typeof data === 'object'
    )
  ) {
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

type BundlerRule = NonNullable<
  NonNullable<BundlerConfig['module']>['rules']
>[0];

export const formatRule = (rule: BundlerRule): RspackRule => {
  if (rule === '...') {
    return rule as RspackRule;
  }

  const formatRuleUse = (use: (typeof rule)['use']) => {
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

      return {
        ...content,
        loader: content.loader,
      };
    });
  };

  return omitBy(
    {
      ...rule,
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
    return splitChunks;
  }

  if (splitChunks.chunks instanceof Function) {
    throw new Error(`chunks not support Function`);
  }

  const formatCacheGroups = (
    cacheGroups?: NonNullable<(typeof splitChunks)['cacheGroups']>,
  ): Exclude<NonNullable<RspackSplitChunks>, false>['cacheGroups'] => {
    if (!cacheGroups) {
      return cacheGroups;
    }
    const formatted = Object.fromEntries(
      Object.entries(cacheGroups).map(([key, group]) => {
        if (
          typeof group === 'string' ||
          group instanceof RegExp ||
          group instanceof Function
        ) {
          throw new Error(`cacheGroups only support object or \`false\``);
        }
        return [
          key,
          (function () {
            if (typeof group === 'object') {
              const {
                chunks,
                name,
                minSize,
                maxAsyncSize,
                maxInitialSize,
                maxSize,
                test,
                ...passTrhough
              } = group;
              if (chunks instanceof Function) {
                throw new Error(`chunks doesn't support function`);
              }
              if (name instanceof Function) {
                throw new Error(`name doesn't support function`);
              }
              return {
                ...passTrhough,
                name,
                chunks,
                minSize: formatSplitSize(minSize, 'minSize'),
                maxAsyncSize: formatSplitSize(maxAsyncSize, 'maxAsyncSize'),
                maxInitialSize: formatSplitSize(
                  maxInitialSize,
                  'maxInitialSize',
                ),
                maxSize: formatSplitSize(maxSize, 'maxSize'),
              };
            }
            return group;
          })(),
        ];
      }),
    );
    // eslint-disable-next-line @typescript-eslint/prefer-ts-expect-error
    // @ts-ignore
    return formatted;
  };

  const { name, cacheGroups, ...rest } = splitChunks;

  if (name instanceof Function) {
    throw new Error(`name not support function`);
  }

  const fallbackCacheGroup = (
    data: NonNullable<typeof splitChunks.fallbackCacheGroup>,
  ) => ({
    maxSize: formatSplitSize(data.maxSize, 'maxSize'),
    maxAsyncSize: formatSplitSize(data.maxSize, 'maxAsyncSize'),
    maxInitialSize: formatSplitSize(data.maxSize, 'maxInitialSize'),
    minSize: formatSplitSize(data.minSize, 'minSize'),
  });

  // eslint-disable-next-line @typescript-eslint/prefer-ts-expect-error
  // @ts-ignore
  return {
    ...rest,

    name,

    maxSize: formatSplitSize(splitChunks.maxSize, 'maxSize'),
    maxAsyncSize: formatSplitSize(splitChunks.maxSize, 'maxAsyncSize'),
    maxInitialSize: formatSplitSize(splitChunks.maxSize, 'maxInitialSize'),
    minSize: formatSplitSize(splitChunks.minSize, 'minSize'),
    chunks: splitChunks.chunks,
    cacheGroups: formatCacheGroups(cacheGroups),
    fallbackCacheGroup: splitChunks.fallbackCacheGroup
      ? fallbackCacheGroup(splitChunks.fallbackCacheGroup)
      : undefined,
  };
};
