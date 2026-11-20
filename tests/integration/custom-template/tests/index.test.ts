import { readFileSync } from 'fs';
import path from 'path';
import { modernBuild } from '../../../utils/modernTestUtils';

describe('custom template', () => {
  const appDir = path.resolve(__dirname, '..');

  test(`should allow to custom template by html.template option`, async () => {
    const result = await modernBuild(appDir);
    expect(result.code).toBe(0);

    expect(
      readFileSync(path.resolve(appDir, `dist/html/index/index.html`), 'utf8'),
    ).toMatchSnapshot();
  });

  test('should allow opting in to mobile meta tags without duplicating the viewport', async () => {
    const result = await modernBuild(appDir, ['-c', 'modern.meta.config.ts']);
    expect(result.code).toBe(0);

    const html = readFileSync(
      path.resolve(appDir, 'dist/meta/html/index/index.html'),
      'utf8',
    );

    expect(html.match(/<meta name="viewport"/g)).toHaveLength(1);
    expect(html).toContain(
      '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">',
    );
    expect(html).toContain(
      '<meta name="format-detection" content="telephone=no">',
    );
  });
});
