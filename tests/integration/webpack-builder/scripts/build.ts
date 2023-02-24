import { createBuilder } from './shared';

(async function main() {
  const builder = await createBuilder();
  try {
    await builder.build();

    if (process.env.RUN_SERVE) {
      const { runStaticServer } = await import('@modern-js/e2e');
      const { port } = await runStaticServer(builder.context.distPath);
      console.log(
        `Successfully build, running server: http://localhost:${port}`,
      );
    }
  } catch (err) {
    console.error(err);
  }
})();
