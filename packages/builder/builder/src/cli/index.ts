import { BuilderPlugin, createBuilder } from '..';
import { setupProgram } from './commands';
import { loadProvider } from './provider';
import { getDefaultEntries, loadConfig } from './config';

export { defineConfig } from './config';

type RunCliOptions = {
  defaultPlugins?: BuilderPlugin[];
};

export async function runCli(options: RunCliOptions = {}) {
  const provider = await loadProvider();
  const config = await loadConfig();
  const builder = await createBuilder(
    provider({
      builderConfig: config as Record<string, unknown>,
    }),
    {
      entry: config.source?.entries || getDefaultEntries(),
    },
  );

  if (options.defaultPlugins) {
    builder.addPlugins(options.defaultPlugins);
  }

  if (config.builderPlugins) {
    builder.addPlugins(config.builderPlugins);
  }

  setupProgram(builder);
}
