import { createModernBuilder } from './createBuilder';

export async function dev(rootDir: string) {
  const builder = await createModernBuilder(rootDir);
  await builder.startDevServer();
}
