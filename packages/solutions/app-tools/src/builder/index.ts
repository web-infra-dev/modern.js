export async function createBuilderGenerator() {
  const { createRspackBuilderForModern } = await import(
    './builder-rspack/index.js'
  );
  return createRspackBuilderForModern;
}

export { parseRspackConfig } from '@modern-js/uni-builder';

export {
  builderPluginAdapterBasic,
  builderPluginAdapterHooks,
} from './shared/builderPlugins';
