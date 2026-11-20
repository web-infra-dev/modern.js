import path from 'node:path';
import {
  type Context,
  compatPlugin,
  createServerBase,
} from '@modern-js/server-core';
import bffPlugin from '../src/server';

export async function createBffServer(prefix = '/api', framework = 'hono') {
  const server = createServerBase({
    pwd: path.join(__dirname, 'fixtures/function'),
    config: {
      html: {},
      output: {},
      source: {},
      tools: {},
      server: {},
      bff: { prefix },
      dev: {},
      security: {},
    },
    appContext: { bffRuntimeFramework: framework },
  });
  server.addPlugins([
    compatPlugin(),
    {
      name: 'test-render',
      setup(api) {
        api.onPrepare(() => {
          api.getServerContext().middlewares.push({
            name: 'render',
            order: 'post',
            handler: async (c: Context) => c.text('render'),
          });
        });
      },
    },
    bffPlugin(),
  ]);
  return server.init();
}
