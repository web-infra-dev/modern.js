import { createBuilder } from './shared';

async function main() {
  process.env.NODE_ENV = 'production';

  const { builder } = await createBuilder();
  try {
    await builder.build();
  } catch (err) {
    console.error(err);
  }
}

main();
