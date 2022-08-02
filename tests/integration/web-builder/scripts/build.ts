import { join } from 'path';

async function run() {
  process.env.NODE_ENV = 'production';

  const { createBuilder } = await import(
    '../../../../packages/builder/web-builder/src'
  );
  const cwd = join(__dirname, '..');
  const builder = await createBuilder({ cwd });

  builder.addPlugins([
    {
      name: 'test-plugin',

      setup(api) {
        api.modifyWebpackConfig(config => {
          config.entry = {
            test: join(builder.context.srcPath, 'index.js'),
          };
          config.output = {
            path: builder.context.distPath,
          };
        });
      },
    },
  ]);

  await builder.build();
}

run();
