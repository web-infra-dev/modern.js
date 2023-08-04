import { expect, getLibuilderTest } from '@/toolkit';

async function build(name: string) {
  const bundler = await getLibuilderTest({
    root: __dirname,
    input: {
      index: `./${name}.ts`,
    },
    format: 'cjs',
    external: ['jq'],
  });

  await bundler.build();
  return bundler;
}

describe('node-enhanced', () => {
  it('normal', async () => {
    const bundler = await build('normal');
    const jsChunk = Object.values(bundler.getJSOutput());
    expect(jsChunk[0].contents.includes('var name = "name"')).to.true;
  });
  it('node build in modules', async () => {
    const bundler = await build('buildin');
    const jsChunk = Object.values(bundler.getJSOutput());
    expect(jsChunk[0].contents.includes('require("path")')).to.true;
    expect(jsChunk[0].contents.includes('require("fs")')).to.true;
  });
  it('node external modules', async () => {
    const bundler = await build('external');
    const jsChunk = Object.values(bundler.getJSOutput());
    expect(jsChunk[0].contents.includes('require("jq")')).to.true;
  });
});
