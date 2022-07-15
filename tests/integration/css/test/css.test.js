/* eslint-disable no-undef */
const path = require('path');
const { resolve } = require('path');
const { fs } = require('@modern-js/utils');
const {
  modernBuild,
  clearBuildDist,
  getPort,
  launchApp,
  killApp,
} = require('../../../utils/modernTestUtils');

const { getCssFiles, readCssFile, copyModules } = require('./utils');

const { readdirSync, readFileSync } = fs;

const fixtures = path.resolve(__dirname, '../fixtures');

afterAll(() => {
  clearBuildDist(fixtures);
});
describe('default less loader options', () => {
  it(`should inline javascript by default`, async () => {
    const appDir = resolve(fixtures, 'less-inline-js');

    await modernBuild(appDir);
    const cssFiles = getCssFiles(appDir);

    expect(cssFiles.length).toBe(1);

    expect(readCssFile(appDir, cssFiles[0])).toContain('body{width:200}');
  });
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

  describe('css source map', () => {
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
    it(`should generate css ts declaration file`, async () => {
      const appDir = path.resolve(fixtures, 'css-ts-declaration');
      const port = await getPort();
      const app = await launchApp(appDir, port);

      const generatedDTSFile = path.resolve(
        appDir,
        'src/index.module.css.d.ts',
      );

      expect(fs.readFileSync(generatedDTSFile, 'utf8')).toContain(
        'export default cssExports',
      );

      fs.unlinkSync(generatedDTSFile);
      await killApp(app);
    });
  });
});

describe('less-support', () => {
  describe('need-less-plugin', () => {
    it(`should have tips to install less plugin`, async () => {
      const appDir = resolve(fixtures, 'tips-to-install-less-plugin');

      const { stdout } = await modernBuild(appDir);

      expect(stdout).toMatch(
        /The configuration of .*tools.less.* is provided by plugin .*@modern-js\/plugin-less.*/,
      );
    });
  });

  describe('base less support', () => {
    it(`should emitted single css file`, async () => {
      const appDir = resolve(fixtures, 'single-less');

      await modernBuild(appDir);

      const cssFiles = getCssFiles(appDir);

      expect(cssFiles.length).toBe(1);

      expect(readCssFile(appDir, cssFiles[0])).toContain(
        '#header{height:20px;width:10px}',
      );
    });

    it(`should emitted multi css file`, async () => {
      const appDir = resolve(fixtures, 'multi-less');

      await modernBuild(appDir);

      const cssFiles = getCssFiles(appDir);

      expect(cssFiles.length).toBe(2);

      expect(
        readCssFile(
          appDir,
          cssFiles.find(name => /a\.[a-z\d]+\.css$/.test(name)),
        ),
      ).toContain('#a{width:10px}');

      expect(
        readCssFile(
          appDir,
          cssFiles.find(name => /b\.[a-z\d]+\.css$/.test(name)),
        ),
      ).toContain('#b{height:20px}');
    });
  });

  describe('base sass support', () => {
    it(`should emitted single css file`, async () => {
      const appDir = resolve(fixtures, 'single-sass');

      await modernBuild(appDir);

      const cssFiles = getCssFiles(appDir);

      expect(cssFiles.length).toBe(1);

      expect(readCssFile(appDir, cssFiles[0])).toContain(
        '#header{height:20px;width:10px}',
      );
    });

    it(`should emitted multi css file`, async () => {
      const appDir = resolve(fixtures, 'multi-sass');

      await modernBuild(appDir);

      const cssFiles = getCssFiles(appDir);

      expect(cssFiles.length).toBe(2);

      expect(
        readCssFile(
          appDir,
          cssFiles.find(name => /a\.[a-z\d]+\.css$/.test(name)),
        ),
      ).toContain('#a{width:10px}');

      expect(
        readCssFile(
          appDir,
          cssFiles.find(name => /b\.[a-z\d]+\.css$/.test(name)),
        ),
      ).toContain('#b{height:20px}');
    });
  });

  describe('less import', () => {
    it('should emitted single css file', async () => {
      const appDir = resolve(fixtures, 'less-import');

      await modernBuild(appDir);

      const cssFiles = getCssFiles(appDir);

      expect(cssFiles.length).toBe(1);
    });

    // less code split 和 css 有区别, node_modules 中 css 会单独提出一个 chunk， less 不会~
    // 现在css 也不会了
    it(`should import less successfully from node_modules`, async () => {
      const appDir = resolve(fixtures, 'less-npm-import');

      copyModules(appDir);

      await modernBuild(appDir);

      const cssFiles = getCssFiles(appDir);

      expect(cssFiles.length).toBe(1);
    });
  });

  describe('support babel plugin import', () => {
    const checkStyle = async (appDir, expectedColor) => {
      const port = await getPort();

      const app = await launchApp(appDir, port);

      await page.goto(`http://localhost:${port}`);

      const bgColor = await page.$eval('button', button =>
        window.getComputedStyle(button).getPropertyValue('background-color'),
      );

      expect(bgColor).toBe(expectedColor);

      await killApp(app);
    };

    it(`should import antd component with style`, async () => {
      await checkStyle(
        resolve(fixtures, 'antd-less-import'),
        'rgb(24, 144, 255)',
      );
    });
  });
});
/* eslint-enable no-undef */
