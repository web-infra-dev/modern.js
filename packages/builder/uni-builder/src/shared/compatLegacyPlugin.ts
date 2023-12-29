import type {
  UniBuilderPlugin,
  UniBuilderPluginAPI,
  UniBuilderContext,
} from '../types';
import type { RsbuildPlugin } from '@rsbuild/core';
import { logger } from '@rsbuild/shared';
import { join } from 'path';

function addDeprecatedWarning(name: string, newName?: string) {
  logger.warn(
    `plugin api '${name}' is deprecated${
      newName ? `, please use '${newName}' instead.` : '.'
    }`,
  );
}
export function compatLegacyPlugin(
  plugin: UniBuilderPlugin,
  extraInfo: {
    cwd: string;
  },
): RsbuildPlugin {
  return {
    ...plugin,
    setup: api => {
      const builderContext = new Proxy(api.context, {
        get(target, prop: keyof UniBuilderContext) {
          switch (prop) {
            case 'target':
              addDeprecatedWarning('context.target', 'context.targets');
              return target.targets;
            case 'srcPath':
              addDeprecatedWarning('context.srcPath');
              return join(extraInfo.cwd, 'src');
            case 'framework':
              addDeprecatedWarning('context.framework');
              return '';
            default: {
              if (prop in target) {
                return target[prop];
              } else {
                return undefined;
              }
            }
          }
        },
        set(_target, prop: keyof UniBuilderContext) {
          logger.error(
            `Context is readonly, you can not assign to the "context.${prop}" prop.`,
          );
          return true;
        },
      }) as UniBuilderContext;

      const legacyAPI: UniBuilderPluginAPI = {
        ...api,
        context: builderContext,
        getBuilderConfig: () => {
          addDeprecatedWarning('getBuilderConfig', 'getRsbuildConfig');
          return api.getRsbuildConfig();
        },
        modifyBuilderConfig: fn => {
          api.modifyRsbuildConfig((config, { mergeRsbuildConfig }) => {
            addDeprecatedWarning('modifyBuilderConfig', 'modifyRsbuildConfig');
            return fn(config, { mergeBuilderConfig: mergeRsbuildConfig });
          });
        },
      };
      return plugin.setup(legacyAPI);
    },
  };
}
