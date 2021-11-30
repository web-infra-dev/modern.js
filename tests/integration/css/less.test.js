/* eslint-disable no-undef */
const { resolve } = require('path');

const {
  launchApp,
  killApp,
  modernBuild,
  getPort,
  installDeps,
  clearBuildDist,
} = require('../../utils/modernTestUtils');

const { getCssFiles, readCssFile, copyModules } = require('./utils');

const fixtures = resolve(__dirname, '../css-fixtures');

beforeAll(async () => {
  await installDeps(fixtures);
});

afterAll(() => {
  clearBuildDist(fixtures);
});

describe('less-support', () => {
  describe('need-less-plugin', () => {
    it(`should have tips to install less plugin`, async () => {
      const appDir = resolve(fixtures, 'tips-to-install-less-plugin');

      const { stdout } = await modernBuild(appDir);

      expect(stdout).toContain(
        'The configuration of tools.less is provided by plugin @modern-js/plugin-less',
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

  describe('default less loader options', () => {
    it(`should inline javascript by default`, async () => {
      const appDir = resolve(fixtures, 'less-inline-js');

      await modernBuild(appDir);

      const cssFiles = getCssFiles(appDir);

      expect(cssFiles.length).toBe(1);

      expect(readCssFile(appDir, cssFiles[0])).toContain('body{width:200}');
    });
  });
});
/* eslint-enable no-undef */
