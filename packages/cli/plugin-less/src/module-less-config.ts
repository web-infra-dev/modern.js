import { NormalizedConfig } from '@modern-js/core';
import { getLessConfig, LessOptions } from '@modern-js/css-config';
import NpmImportPlugin from 'less-plugin-npm-import';
import { LessOption as ResolvedLessOption } from '@modern-js/style-compiler';

export const moduleLessConfig = ({
  modernConfig,
  npmImportPrefix = '~',
}: {
  modernConfig: NormalizedConfig;
  npmImportPrefix?: string;
}): ResolvedLessOption => {
  const lessConfig = getLessConfig(modernConfig) as LessOptions;

  return {
    enableSourceMap: lessConfig.sourceMap || false,
    lessOption: {
      ...lessConfig.lessOptions,
      plugins: [
        new NpmImportPlugin({ prefix: npmImportPrefix }),
        ...((lessConfig.lessOptions?.plugins as Less.Options['plugins']) || []),
      ],
    },
  };
};
