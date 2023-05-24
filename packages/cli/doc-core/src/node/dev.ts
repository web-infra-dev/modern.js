import { UserConfig } from 'shared/types';
import { removeLeadingSlash } from '../shared/utils';
import { createModernBuilder } from './createBuilder';
import { writeSearchIndex } from './searchIndex';
import { PluginDriver } from './PluginDriver';

interface ServerInstance {
  close: () => Promise<void>;
}

export async function dev(
  rootDir: string,
  config: UserConfig,
): Promise<ServerInstance> {
  const base = config.doc?.base ?? '';
  const isProd = false;
  const pluginDriver = new PluginDriver(config, isProd);
  await pluginDriver.init();

  try {
    const modifiedConfig = await pluginDriver.modifyConfig();
    await pluginDriver.beforeBuild();
    const builder = await createModernBuilder(
      rootDir,
      modifiedConfig,
      pluginDriver,
      false,
      {},
    );
    const { server } = await builder.startDevServer({
      printURLs: urls => {
        return urls.map(({ label, url }) => ({
          label,
          url: `${url}/${removeLeadingSlash(base)}`,
        }));
      },
    });

    await pluginDriver.afterBuild();
    return server;
  } finally {
    await writeSearchIndex(config);
  }
}
