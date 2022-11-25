import { createBuilder } from './shared';

(async function main() {
  const builder = await createBuilder();
  try {
    await builder.startDevServer();
  } catch (err) {
    console.error(err);
  }
})();
