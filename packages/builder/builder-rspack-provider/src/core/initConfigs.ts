import {
  debug,
  isDebug,
  type PluginStore,
  type InspectConfigOptions,
  type CreateBuilderOptions,
  deepFreezed,
} from '@modern-js/builder-shared';
import { normalizeConfig } from 'src/config/normalize';
import type { Context } from '../types';
import { generateRspackConfig } from './rspackConfig';

async function modifyBuilderConfig(context: Context) {
  debug('modify builder config');
  const [modified] = await context.hooks.modifyBuilderConfigHook.call(
    context.config,
  );
  context.config = deepFreezed(modified);
  debug('modify builder config done');
}

export type InitConfigsOptions = {
  context: Context;
  pluginStore: PluginStore;
  builderOptions: Required<CreateBuilderOptions>;
};

export async function initConfigs({
  context,
  pluginStore,
  builderOptions,
}: InitConfigsOptions) {
  const { ensureArray } = await import('@modern-js/utils');

  await context.configValidatingTask;

  await modifyBuilderConfig(context);
  context.normalizedConfig = deepFreezed(normalizeConfig(context.config));

  // todo generate config with target
  const targets = ensureArray(builderOptions.target);
  const rspackConfigs = await Promise.all(
    targets.map(target => generateRspackConfig({ target, context })),
  );

  return {
    rspackConfigs: rspackConfigs,
  };
}
