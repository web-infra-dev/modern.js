import { expect, getLibuilderTest } from '@/toolkit';

describe('external', () => {
  it('RegExp match', async () => {
    const bundler = await getLibuilderTest({
      root: __dirname,
      input: {
        main: './index.tsx',
      },
      external: [/@test\/a(\/.*)?/, '@test/b'],
    });
    await bundler.build();
    const jsOutput = bundler.getJSOutput();
    const jsChunk = Object.values(jsOutput);

    expect(jsChunk[0].contents).be.equal(
      `${`
// index.tsx
import a from "@test/a/lib/worker";
import b from "@test/b";
console.log(a);
console.log(b);
    `.trim()}\n`
    );
  });
});
