import { getLibuilderTest, expect } from '@/toolkit';
import fs from 'fs';

describe('fixture:clean', () => {
  it('output path should empty', async () => {
    const bundler = await getLibuilderTest({
      root: __dirname,
      clean: true,
      plugins: [
        {
          name: 'test-clean',
          apply(compiler) {
            compiler.hooks.startCompilation.tap({ name: 'test_clean', stage: compiler.STAGE.POST_INTERNAL }, () => {
              const shouldFalse = fs.existsSync(bundler.config.outdir);
              expect(shouldFalse).to.false;
            });
          },
        },
      ],
    });
    await bundler.build();
  });
});
