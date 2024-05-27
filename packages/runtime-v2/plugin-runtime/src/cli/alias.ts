import path from 'path';
import { Entrypoint } from '@modern-js/types';
import type { RsbuildPlugin } from '@rsbuild/core';
import { ENTRY_POINT_REGISTER_FILE_NAME } from './constants';

export const pluginAlias = ({
  entrypoints,
  internalDirectory,
}: {
  entrypoints: Entrypoint[];
  internalDirectory: string;
}): RsbuildPlugin => ({
  name: 'runtime:alias',
  setup(api) {
    api.modifyRsbuildConfig((userConfig, { mergeRsbuildConfig }) => {
      //   const { entrypoints, internalDirectory } = api.useAppContext();
      const entrypointsAlias: Record<string, string> = {};
      entrypoints.forEach(
        entrypoint =>
          (entrypointsAlias[
            `@modern-js/runtime-v2/registry/${entrypoint.entryName}`
          ] = path.join(
            internalDirectory,
            entrypoint.entryName,
            ENTRY_POINT_REGISTER_FILE_NAME,
          )),
      );
      return mergeRsbuildConfig(userConfig, {
        source: {
          alias: entrypointsAlias,
        },
      });
    });
  },
});
