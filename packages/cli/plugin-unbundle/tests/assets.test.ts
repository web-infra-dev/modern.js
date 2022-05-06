import path from 'path';
import { fs } from '@modern-js/utils';
import { assetsPlugin, transformSvg } from '../src/plugins/assets';

describe('unbundle test assets plugin', () => {
  const fixturePath = path.join(__dirname, './fixtures/assets');
  const fixtureDistPath = path.join(fixturePath, './dist');

  it('test has plugin', () => {
    expect(assetsPlugin).toBeTruthy();
  });

  it('test transformSvg', async () => {
    const svgCode = await fs.readFile(
      path.join(fixturePath, './Logo.svg'),
      'utf8',
    );
    const result = await transformSvg(
      svgCode,
      '',
      path.join(fixtureDistPath, 'Logo.svg'),
    );
    expect(result).toBeTruthy();
    // TODO: verify result file format
  });
});
