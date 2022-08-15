import { createServer } from '../../../../packages/solutions/app-tools/src/utils/createServer';
import { createBuilder } from './shared';

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
