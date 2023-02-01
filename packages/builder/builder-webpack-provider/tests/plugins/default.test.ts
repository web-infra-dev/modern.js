import { expect, describe, it } from 'vitest';
import { createStubBuilder } from '@/stub';
import type { BuilderPlugin } from '@/types';

describe('applyDefaultPlugins', () => {
  it('should apply default plugins correctly', async () => {
    const { NODE_ENV } = process.env;
    process.env.NODE_ENV = 'development';
    const builder = await createStubBuilder({
      plugins: 'default',
    });

    const config = await builder.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();

    process.env.NODE_ENV = NODE_ENV;
  });

  it('should apply default plugins correctly when production', async () => {
    const { NODE_ENV } = process.env;
    process.env.NODE_ENV = 'production';
    const builder = await createStubBuilder({
      plugins: 'default',
    });

    const config = await builder.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();

    process.env.NODE_ENV = NODE_ENV;
  });

  it('should apply default plugins correctly when target web worker', async () => {
    const { NODE_ENV } = process.env;
    process.env.NODE_ENV = 'production';
    const builder = await createStubBuilder({
      plugins: 'default',
      target: ['web-worker'],
    });

    const config = await builder.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();

    process.env.NODE_ENV = NODE_ENV;
  });

  it('should apply default plugins correctly when target node', async () => {
    const { NODE_ENV } = process.env;
    process.env.NODE_ENV = 'production';
    const builder = await createStubBuilder({
      plugins: 'default',
      target: ['node'],
    });

    const config = await builder.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();

    process.env.NODE_ENV = NODE_ENV;
  });
});

describe('bundlerApi', () => {
  it('test modifyBundlerChain and api order', async () => {
    const testPlugin: BuilderPlugin = {
      name: 'builder-plugin-devtool',
      setup: api => {
        api.modifyBundlerChain(chain => {
          chain.target('node');
          chain.devtool('cheap-module-source-map');
        });

        api.modifyWebpackChain(chain => {
          chain.devtool('hidden-source-map');
        });
      },
    };

    const builder = await createStubBuilder({
      plugins: [testPlugin],
    });

    const config = await builder.unwrapWebpackConfig();

    expect(config).toMatchInlineSnapshot(`
      {
        "devtool": "hidden-source-map",
        "target": "node",
      }
    `);
  });
});
