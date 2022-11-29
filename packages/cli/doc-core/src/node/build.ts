import { createModernBuilder } from './createBuilder';

export async function build(rootDir: string) {
  const builder = await createModernBuilder(rootDir);

  // bundle client and server
  builder.build();
}
