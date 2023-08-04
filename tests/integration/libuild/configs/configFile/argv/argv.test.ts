import { resolve } from 'path';
import { expect, getLibuilderTest } from '@/toolkit';

describe('config:configFile', () => {
  it('should read argv.config.js, and params has root', async () => {
    const root = __dirname;
    const bundler = await getLibuilderTest({
      root,
      configFile: './argv.config.js',
    });
    expect(bundler.config.configFile).equal(resolve(root, './argv.config.js'));
  });

  it('should read argv.config.js, and params do not has root', async () => {
    const configFile = resolve(__dirname, './argv.config.js');
    const bundler = await getLibuilderTest({
      configFile,
    });
    expect(bundler.config.configFile).equal(configFile);
  });
});
