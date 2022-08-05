import { createBuilder } from './shared';

async function main() {
  process.env.NODE_ENV = 'production';

  const { builder } = await createBuilder();
  await builder.build();
}

main();
