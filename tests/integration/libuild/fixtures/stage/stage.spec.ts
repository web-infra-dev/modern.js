import path from 'path';
import { expect, getLibuilderTest } from '@/toolkit';

describe('stage', () => {
  it('stage order', async () => {
    const order: string[] = [];
    const bundler = await getLibuilderTest({
      root: path.resolve(__dirname, ''),
      plugins: [
        {
          name: 'pre',
          apply(compiler) {
            compiler.hooks.load.tap(
              {
                name: 'pre',
                stage: 1,
              },
              () => {
                order.push('pre');
              }
            );
            compiler.hooks.load.tap(
              {
                name: 'post',
                stage: 2,
              },
              () => {
                order.push('post');
              }
            );
          },
        },
      ],
    });
    await bundler.build();
    expect(order).deep.equal(['pre', 'post']);
  });
});
