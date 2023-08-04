import assert from 'assert';
import { getLibuilderTest } from '@/toolkit';

describe('fixture:sideEffects', () => {
  it('lodash-es', async () => {
    const bundler = await getLibuilderTest({
      root: __dirname,
      plugins: [
        {
          name: 'test',
          apply(compiler) {
            compiler.hooks.processAssets.tapPromise('test', async (bundles) => {
              for (const [key, value] of bundles.entries()) {
                if (key.endsWith('.js')) {
                  assert.equal(value.contents.length - 10000 < 0, true);
                }
              }
            });
          },
        },
      ],
    });
    bundler.build();
  });
  it('effects:resolve', async () => {
    const bundler = await getLibuilderTest({
      root: __dirname,
      input: {
        index: './other.ts',
      },
    });
    await bundler.build();
    const js = bundler.getJSOutput();
    for (const item of Object.values(js)) {
      if (item.type === 'chunk') {
        assert(item.contents.includes('globalEffect'), 'this should be included');
        assert(!item.contents.includes('indexEffect'), 'this should be included');
      }
    }
  });
  it('reg:sideEffects', async () => {
    const bundler = await getLibuilderTest({
      root: __dirname,
      input: {
        config: './config.ts',
      },
      sideEffects: [/\.js$/],
    });
    await bundler.build();
    const js = bundler.getJSOutput();
    for (const item of Object.values(js)) {
      if (item.type === 'chunk') {
        assert(item.contents.includes('indexEffect'), 'this should be included');
        assert(item.contents.includes('antd'), 'this should be included');
      }
    }
  });
  it('function:sideEffects', async () => {
    const bundler = await getLibuilderTest({
      root: __dirname,
      input: {
        configFunc: './config.ts',
      },
      sideEffects: (id) => id.endsWith('.js'),
    });
    await bundler.build();
    const js = bundler.getJSOutput();
    for (const item of Object.values(js)) {
      if (item.type === 'chunk') {
        assert(item.contents.includes('indexEffect'), 'this should be included');
        assert(item.contents.includes('antd'), 'this should be included');
      }
    }
  });
});
