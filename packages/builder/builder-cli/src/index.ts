import { createBuilder } from '@modern-js/builder';
import { setupProgram } from './commands';
import { loadProvider } from './provider';
import { getDefaultEntries, loadConfig } from './config';

export { defineConfig } from './config';

export async function run() {
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

  if (config.builderPlugins) {
    builder.addPlugins(config.builderPlugins);
  }

  setupProgram(builder);
}
