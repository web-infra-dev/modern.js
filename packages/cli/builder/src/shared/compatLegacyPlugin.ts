import { join } from 'path';
import { type RsbuildPlugin, logger } from '@rsbuild/core';
import type { BuilderContext, BuilderPlugin, BuilderPluginAPI } from '../types';

function addDeprecatedWarning(
  pluginName: string,
  name: string,
  newName?: string,
) {
  logger.warn(
    `Plugin(${pluginName})'s api '${name}' is deprecated${
      newName ? `, please use '${newName}' instead.` : '.'
    }`,
  );
}
