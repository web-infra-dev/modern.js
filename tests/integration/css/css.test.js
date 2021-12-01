const path = require('path');
const fs = require('fs');
const { readdirSync, readFileSync } = require('fs-extra');
const {
  modernBuild,
  installDeps,
  clearBuildDist,
} = require('../../utils/modernTestUtils');

const { getCssFiles, readCssFile, copyModules } = require('./utils');

const fixtures = path.resolve(__dirname, '../css-fixtures');

beforeAll(async () => {
  await installDeps(fixtures);
});

afterAll(() => {
  clearBuildDist(fixtures);
});

describe('test css support', () => {
  describe('base css support', () => {
    it(`should emitted single css file `, async () => {
      const appDir = path.resolve(fixtures, 'single-css');

      await modernBuild(appDir);

      const files = getCssFiles(appDir);

      expect(files.length).toBe(1);

      expect(
        readFileSync(
          path.resolve(appDir, `dist/static/css/${files[0]}`),
          'utf8',
        ),
      ).toContain('#base-css{color:red}');
    });
  });

  describe('multi page css', () => {
    it('should emitted multiple css files', async () => {
      const appDir = path.resolve(fixtures, 'multi-css');

      await modernBuild(appDir);

      const cssFiles = getCssFiles(appDir);

      expect(cssFiles.length).toBe(3);

      expect(
        readFileSync(
          path.resolve(
            appDir,
            `dist/static/css/${cssFiles.find(f => f.startsWith('entry1'))}`,
          ),
          'utf8',
        ),
      ).toContain('#entry1{color:red}');

      // css-nano colormin optimization
      expect(
        readFileSync(
          path.resolve(
            appDir,
            `dist/static/css/${cssFiles.find(f => f.startsWith('entry2'))}`,
          ),
          'utf8',
        ),
      ).toContain('#entry2{color:blue}');

      expect(
        readFileSync(
          path.resolve(
            appDir,
            `dist/static/css/${cssFiles.find(f => f.startsWith('entry3'))}`,
          ),
          'utf8',
        ),
      ).toContain('#entry3{color:#ff0}');
    });
  });

  describe('import css', () => {
    it('should emitted single css file ', async () => {
      const appDir = path.resolve(fixtures, 'base-import');

      await modernBuild(appDir);

      const cssFiles = getCssFiles(appDir);

      expect(cssFiles.length).toBe(1);

      expect(readCssFile(appDir, cssFiles[0])).toContain(
        'body{color:#dcdcdc}#demo{font-size:18px}',
      );
    });
    it('should emitted single css file with merged styles', async () => {
      const appDir = path.resolve(fixtures, 'import-common-css');

      await modernBuild(appDir);

      const cssFiles = getCssFiles(appDir);

      expect(cssFiles.length).toBe(1);

      expect(readCssFile(appDir, cssFiles[0])).toContain(
        'html{min-height:100%}#a{color:red}#b{color:blue}',
      );
    });
  });

  describe('import css from node_modules', () => {
    it('should emitted single css file', async () => {
      const appDir = path.resolve(fixtures, 'npm-import');

      copyModules(appDir);

      await modernBuild(appDir);

      const cssFiles = getCssFiles(appDir);

      expect(cssFiles.length).toBe(1);

      const main = cssFiles.filter(fileName =>
        /main\.[a-z\d]+\.css$/.test(fileName),
      );

      expect(readCssFile(appDir, main)).toContain(
        'body{color:#ff0;width:960px}html{min-height:100%}',
      );
    });

    // https://github.com/webpack-contrib/css-loader/blob/master/CHANGELOG.md#bug-fixes-6
    it('should compile successfully', async () => {
      const appDir = path.resolve(fixtures, 'bad-npm-import');

      copyModules(appDir);

      await modernBuild(appDir);
      const cssFiles = getCssFiles(appDir);

      expect(cssFiles.length).toBe(1);

      const main = cssFiles.filter(fileName =>
        /main\.[a-z\d]+\.css$/.test(fileName),
      );

      expect(readCssFile(appDir, main)).toContain(
        `body{width:100%}html{min-height:100%}`,
      );
    });
  });

  describe('nested import css from node_modules', () => {
    it('should emitted single css file', async () => {
      const appDir = path.resolve(fixtures, 'nested-npm-import');

      copyModules(appDir);

      await modernBuild(appDir);

      const cssFiles = getCssFiles(appDir);

      expect(cssFiles.length).toBe(1);

      const main = cssFiles.filter(fileName =>
        /main\.[a-z\d]+\.css$/.test(fileName),
      );

      expect(readCssFile(appDir, main)).toContain(
        '#b{color:#ff0}#a{font-size:10px}html{font-size:18px}',
      );
    });

    // https://github.com/webpack-contrib/css-loader/blob/master/CHANGELOG.md#bug-fixes-6
    it('should compile successfully', async () => {
      const appDir = path.resolve(fixtures, './bad-nested-npm-import');

      copyModules(appDir);

      await modernBuild(appDir);
      const cssFiles = getCssFiles(appDir);

      expect(cssFiles.length).toBe(1);

      const main = cssFiles.filter(fileName =>
        /main\.[a-z\d]+\.css$/.test(fileName),
      );

      expect(readCssFile(appDir, main)).toContain(
        `#b{color:#ff0}#a{font-size:10px}html{font-size:18px}`,
      );
    });
  });

  describe('css url function', () => {
    // FIXME: import svg in css files
    // it('should use data-uri load image', async () => {
    //   const appDir = path.resolve(fixtures, 'inline-css-url');

    //   await modernBuild(appDir, [], { stderr: true });

    //   const cssFiles = getCssFiles(appDir);

    //   expect(cssFiles.length).toBe(1);

    //   expect(readCssFile(appDir, cssFiles[0])).toMatch(
    //     /background:url\(data:image\/svg\+xml;base64/,
    //   );
    // });
    it('should keep image url', async () => {
      const appDir = path.resolve(fixtures, 'keep-css-url');

      await modernBuild(appDir);

      const cssFiles = getCssFiles(appDir);

      expect(cssFiles.length).toBe(1);

      expect(readCssFile(appDir, cssFiles[0])).toMatch(
        /background:url\(\/static\/media\/logo\.[a-z0-9]+\.png/,
      );
    });
  });

  describe('css souce map', () => {
    const getCssMaps = appDir =>
      readdirSync(path.resolve(appDir, 'dist/static/css')).filter(filepath =>
        /\.css\.map$/.test(filepath),
      );

    it('should generate source map', async () => {
      const appDir = path.resolve(fixtures, 'base-import');

      await modernBuild(appDir);

      const cssMaps = getCssMaps(appDir);

      expect(cssMaps.length).toBe(1);
    });

    it(`shouldn't generate source map`, async () => {
      const appDir = path.resolve(fixtures, 'disable-source-map');

      await modernBuild(appDir);

      const cssMaps = getCssMaps(appDir);

      expect(cssMaps.length).toBe(0);
    });
    it(`should generate css ts decalration file`, async () => {
      const appDir = path.resolve(fixtures, 'css-ts-declaration');
      await modernBuild(appDir);

      const generatedDTSFile = path.resolve(
        appDir,
        'src/index.module.css.d.ts',
      );

      expect(fs.readFileSync(generatedDTSFile, 'utf8')).toContain(
        'export default cssExports',
      );

      fs.unlinkSync(generatedDTSFile);
    });
  });
});
