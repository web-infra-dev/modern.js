import { createBuilder } from './shared';

(async function main() {
  const builder = await createBuilder();
<<<<<<< HEAD
  await builder.inspectConfig({
=======
  await builder.inspectBundlerConfig({
    writeToDisk: true,
  });
  await builder.inspectBuilderConfig({
>>>>>>> f7e6f5a72 (chore(builder): rename inspectBundlerConfig method (#1790))
    writeToDisk: true,
  });
})();
