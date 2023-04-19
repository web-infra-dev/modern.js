import { UserConfig } from 'shared/types';

import { removeLeadingSlash } from '../shared/utils';
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
  const base = config.doc?.base ?? '';
  const isProd = false;

  try {
    const modifiedConfig = await modifyConfig({
      config,
    });
    await beforeBuild({
      config: modifiedConfig,
      isProd,
    });

    const builder = await createModernBuilder(rootDir, modifiedConfig);
    const { server } = await builder.startDevServer({
      printURLs: urls => {
        return urls.map(({ label, url }) => ({
          label,
          url: `${url}/${removeLeadingSlash(base)}`,
        }));
      },
    });

    await afterBuild({
      config: modifiedConfig,
      isProd,
    });
    return server;
  } finally {
    await writeSearchIndex(config);
  }
}
