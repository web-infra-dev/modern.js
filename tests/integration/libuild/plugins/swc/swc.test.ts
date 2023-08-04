import { expect, getLibuilderTest } from '@/toolkit';
import { swcTransformPlugin } from '@modern-js/libuild-plugin-swc';

describe('fixture:plugin:swc', function () {
  it('plugin:swc-transform', async () => {
    const bundler = await getLibuilderTest({
      root: __dirname,
      input: ['./index.tsx'],
      plugins: [
        swcTransformPlugin(),
      ],
      external: [/^react\//, /^antd\/*/],
    });
    await bundler.build();

    const jsOutput = Object.values(bundler.getJSOutput());
    expect(jsOutput[0].contents.includes('__metadata')).to.be.false;
    expect(jsOutput[0].contents.includes('@swc+helpers')).to.be.false;
    expect(jsOutput[0].contents.includes('antd/es/button')).to.be.false;
    expect(jsOutput[0].contents).toMatchSnapshot();
  });

  it('plugin:swc-transform:externalHelpers', async () => {
    const bundler = await getLibuilderTest({
      root: __dirname,
      input: ['./index.tsx'],
      plugins: [
        swcTransformPlugin({
          externalHelpers: true,
        }),
      ],
      external: [/^react\//, /^antd\/*/],
    });
    await bundler.build();

    const jsOutput = Object.values(bundler.getJSOutput());
    expect(jsOutput[0].contents.includes('@swc+helpers')).to.be.true;
    expect(jsOutput[0].contents).toMatchSnapshot();
  });

  it('plugin:swc-transform:emitDecoratorMetadata', async () => {
    const bundler = await getLibuilderTest({
      root: __dirname,
      input: ['./index.tsx'],
      plugins: [
        swcTransformPlugin({
          emitDecoratorMetadata: true,
        }),
      ],
      external: [/^react\//, /^antd\/*/],
    });
    await bundler.build();

    const jsOutput = Object.values(bundler.getJSOutput());
    expect(jsOutput[0].contents.includes('_metadata')).to.be.true;
    expect(jsOutput[0].contents).toMatchSnapshot();
  });

  it('plugin:swc-transform:pluginImport', async () => {
    const bundler = await getLibuilderTest({
      root: __dirname,
      input: ['./index.tsx'],
      plugins: [
        swcTransformPlugin({
          pluginImport: [
            {
              libraryName: 'antd',
              libraryDirectory: 'es',
              style: true,
            }
          ],
        }),
      ],
      external: [/^react\//, /^antd\/*/],
    });
    await bundler.build();

    const jsOutput = Object.values(bundler.getJSOutput());
    expect(jsOutput[0].contents.includes('antd/es/button')).to.be.true;
    expect(jsOutput[0].contents).toMatchSnapshot();
  });
});
