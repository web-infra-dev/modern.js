const path = require('path');
const fs = require('fs');
const { modernBuild } = require('../../utils/modernTestUtils');

beforeAll(() => {
  jest.setTimeout(1000 * 60 * 2);
});

const fixtures = path.resolve(__dirname, 'fixtures');

describe('inline image/fonts assets', () => {
  it('should inline svg file and emit a jpg file ', async () => {
    const appDir = path.resolve(fixtures, 'inline-limit');

    await modernBuild(appDir);

    const medias = fs.readdirSync(path.resolve(appDir, 'dist/static/image'));

    expect(medias.length).toBe(1);
  });

  it('should always inline assets regardless of size', async () => {
    const appDir = path.resolve(fixtures, 'always-inline');

    await modernBuild(appDir);

    const exists = fs.existsSync(path.resolve(appDir, 'dist/static/image'));

    expect(exists).toBe(false);
  });

  it('should always emit assets', async () => {
    const appDir = path.resolve(fixtures, 'always-url');

    await modernBuild(appDir);

    const image = fs.readdirSync(path.resolve(appDir, 'dist/static/image'));

    expect(image.length).toBe(1);

    const svg = fs.readdirSync(path.resolve(appDir, 'dist/static/svg'));

    expect(svg.length).toBe(1);
  });

  it('should emit svg in css background', async () => {
    const appDir = path.resolve(fixtures, 'assets-in-css');

    await modernBuild(appDir);

    const medias = fs.readdirSync(path.resolve(appDir, 'dist/static/svg'));

    const cssFiles = fs
      .readdirSync(path.resolve(appDir, 'dist/static/css'))
      .filter(name => /\.css$/.test(name));

    expect(medias.length).toBe(1);

    expect(medias[0]).toMatch(/\.svg$/);

    expect(
      fs.readFileSync(
        path.resolve(appDir, `dist/static/css/${cssFiles[0]}`),
        'utf8',
      ),
    ).toContain('background:url(data:image/jpeg;');
  });
});
