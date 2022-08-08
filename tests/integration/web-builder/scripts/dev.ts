import { ModernDevServerOptions, Server } from '@modern-js/server';
import { createBuilder } from './shared';

let server: Server | null = null;

const createServer = async (options: ModernDevServerOptions) => {
  if (server) {
    await server.close();
  }
  server = new Server(options);
  const app = await server.init();
  return app;
};

async function main() {
  process.env.NODE_ENV = 'development';

  const { cwd, builder } = await createBuilder();
  const compiler = await builder.createCompiler();

  const frameworkConfig = {
    source: {},
    tools: {},
    server: {},
  } as any;

  const app = await createServer({
    pwd: cwd,
    dev: {
      hot: true,
      liveReload: true,
    },
    compiler,
    config: frameworkConfig,
  });

  app.listen(8080, async (err: Error) => {
    if (err) {
      throw err;
    }
  });
}

main();
