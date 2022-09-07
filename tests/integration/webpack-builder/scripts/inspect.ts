import { createBuilder } from './shared';

(async function main() {
  const builder = await createBuilder();
  await builder.inspectWebpackConfig({
    writeToDisk: true,
  });
  await builder.inspectBuilderConfig({
    writeToDisk: true,
  });
})();
