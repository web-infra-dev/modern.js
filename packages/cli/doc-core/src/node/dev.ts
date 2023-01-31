import path from 'path';
import { UserConfig } from 'shared/types';
import { createModernBuilder } from './createBuilder';
import { writeSearchIndex } from './searchIndex';

interface ServerInstance {
  close: () => Promise<void>;
}

export async function dev(
  rootDir: string,
  config: UserConfig,
): Promise<ServerInstance> {
  const builder = await createModernBuilder(rootDir, config);
  const { server } = await builder.startDevServer();
  const userRoot = path.resolve(rootDir || config.doc?.root || process.cwd());
  await writeSearchIndex(userRoot, config);
  return server;
}
