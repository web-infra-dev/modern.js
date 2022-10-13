import { createBuilder } from './shared';

(async function main() {
  const builder = await createBuilder();
  await builder.build({
    watch: true,
    mode: 'development',
  });
})();
