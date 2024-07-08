import path from 'path';
import { Entrypoint } from '@modern-js/types';
import type { RsbuildPlugin } from '@rsbuild/core';
import { ENTRY_POINT_REGISTER_FILE_NAME } from './constants';

export const builderPluginAlias = ({
  entrypoints,
  internalDirectory,
  metaName,
}: {
  entrypoints: Entrypoint[];
  internalDirectory: string;
  metaName: string;
}): RsbuildPlugin => ({
  name: 'runtime:alias',
  setup(api) {
    api.modifyRsbuildConfig((userConfig, { mergeRsbuildConfig }) => {
      const entrypointsAlias: Record<string, string> = {};
      // main entry alias need to be placed at the end of alias object
      const mainEntrypointsAlias: Record<string, string> = {};
      entrypoints.forEach(entrypoint => {
        entrypointsAlias[
          `@${metaName}/runtime/registry/${entrypoint.entryName}`
        ] = path.join(
          internalDirectory,
          entrypoint.entryName,
          ENTRY_POINT_REGISTER_FILE_NAME,
        );
        if (entrypoint.isMainEntry) {
          mainEntrypointsAlias[`@${metaName}/runtime/registry`] = path.join(
            internalDirectory,
            entrypoint.entryName,
            ENTRY_POINT_REGISTER_FILE_NAME,
          );
        }
      });
      return mergeRsbuildConfig(userConfig, {
        source: {
          alias: { ...entrypointsAlias, ...mainEntrypointsAlias },
        },
      });
    });
  },
});
