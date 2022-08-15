import { createBuilder } from './shared';

async function main() {
  const { builder } = await createBuilder();
  try {
    await builder.inspectWebpackConfig({
      writeToDisk: true,
    });
  } catch (err) {
    console.error(err);
  }
}

main();
