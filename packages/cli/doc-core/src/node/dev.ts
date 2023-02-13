import path from 'path';
import { UserConfig } from 'shared/types';
import { createModernBuilder } from './createBuilder';
import { writeSearchIndex } from './searchIndex';
import { modifyConfig, beforeBuild, afterBuild } from './hooks';

interface ServerInstance {
  close: () => Promise<void>;
}

export async function dev(
  rootDir: string,
  config: UserConfig,
): Promise<ServerInstance> {
  const docPlugins = [...(config.doc?.plugins ?? [])];
  const isProd = false;
  const modifiedConfig = await modifyConfig({
    config,
    docPlugins,
  });
  await beforeBuild({
    config: modifiedConfig,
    docPlugins,
    isProd,
  });
  const builder = await createModernBuilder(rootDir, modifiedConfig);
  const { server } = await builder.startDevServer();
  await afterBuild({
    config: modifiedConfig,
    docPlugins,
    isProd,
  });

  const userRoot = path.resolve(rootDir || config.doc?.root || process.cwd());
  await writeSearchIndex(userRoot, config);
  return server;
}
