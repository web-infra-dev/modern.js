import { Server } from '@modern-js/server';
import { createBuilder } from './shared';

(async function main() {
  process.env.NODE_ENV = 'development';

  const builder = await createBuilder();
  const compiler = await builder.createCompiler();

  const server = new Server({
    pwd: process.cwd(),
    dev: {
      hot: true,
      liveReload: true,
    },
    compiler,
    config: {
      source: {},
      tools: {},
      server: {},
    } as any,
  });

  const app = await server.init();

  app.listen(8080, async (err: Error) => {
    if (err) {
      throw err;
    }
  });
})();
