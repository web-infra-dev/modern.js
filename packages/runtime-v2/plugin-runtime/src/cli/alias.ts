import path from 'path';
import { Entrypoint } from '@modern-js/types';
import type { RsbuildPlugin } from '@rsbuild/core';
import { ENTRY_POINT_REGISTER_FILE_NAME } from './constants';

export const pluginAlias = ({
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
      //   const { entrypoints, internalDirectory } = api.useAppContext();
      const entrypointsAlias: Record<string, string> = {};
      entrypoints.forEach(entrypoint => {
        if (entrypoint.isMainEntry) {
          entrypointsAlias[`@${metaName}/runtime-v2/registry`] = path.join(
            internalDirectory,
            entrypoint.entryName,
            ENTRY_POINT_REGISTER_FILE_NAME,
          );
        }
        entrypointsAlias[
          `@${metaName}/runtime-v2/registry/${entrypoint.entryName}`
        ] = path.join(
          internalDirectory,
          entrypoint.entryName,
          ENTRY_POINT_REGISTER_FILE_NAME,
        );
      });
      return mergeRsbuildConfig(userConfig, {
        source: {
          alias: entrypointsAlias,
        },
      });
    });
  },
});
