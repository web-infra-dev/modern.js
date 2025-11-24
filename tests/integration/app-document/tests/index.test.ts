import fs from 'fs';
import path from 'path';
import puppeteer, { type Browser, type Page } from 'puppeteer';

import {
  getPort,
  killApp,
  launchApp,
  launchOptions,
  modernBuild,
} from '../../../utils/modernTestUtils';
import { SequenceWait } from '../../../utils/testInSequence';

const appDir = path.resolve(__dirname, '../');

function existsSync(filePath: string) {
  return fs.existsSync(path.join(appDir, 'dist', filePath));
}
describe('test dev and build', () => {
  const curSequenceWait = new SequenceWait();
  curSequenceWait.add('test-dev');
  curSequenceWait.add('test-rem');

  describe('test build', () => {
    let buildRes: any;
    beforeAll(async () => {
      buildRes = await modernBuild(appDir);
    });
    afterAll(() => {
      curSequenceWait.done('test-dev');
    });

    test(`should get right alias build!`, async () => {
      if (buildRes.code !== 0) {
        console.log('\n===> build failed, stdout: ', buildRes.stdout);
        console.log('\n===> build failed, stderr: ', buildRes.stderr);
      }
      expect(buildRes.code).toEqual(0);
      expect(existsSync('route.json')).toBe(true);
      expect(existsSync('html/test/index.html')).toBe(true);
      expect(existsSync('html/sub/index.html')).toBe(true);
    });

    test('should have the test html and the correct content', async () => {
      const htmlNoDoc = fs.readFileSync(
        path.join(appDir, 'dist', 'html/test/index.html'),
        'utf-8',
      );
      expect(htmlNoDoc.includes('<div id="root"><!--<?- html ?>--></div>'));
    });

    test('should have the sub html and the correct content', async () => {
      const htmlWithDoc = fs.readFileSync(
        path.join(appDir, 'dist', 'html/sub/index.html'),
        'utf-8',
      );
      expect(htmlWithDoc.includes('<div id="root"><!--<?- html ?>--><h1'));
    });

    test('should has comment in Head', async () => {
      const htmlWithDoc = fs.readFileSync(
        path.join(appDir, 'dist', 'html/sub/index.html'),
        'utf-8',
      );

      expect(htmlWithDoc.includes('<!-- COMMENT BY APP -->')).toBe(true);
      expect(htmlWithDoc.includes('== COMMENT BY APP in inline ==')).toBe(true);
      expect(htmlWithDoc.includes('== COMMENT BY APP but inline ==')).toBe(
        false,
      );
    });

    test('should has style in Head', async () => {
      const htmlWithDoc = fs.readFileSync(
        path.join(appDir, 'dist', 'html/sub/index.html'),
        'utf-8',
      );

      expect(htmlWithDoc.includes('.logo-spin>div:last-child')).toBe(true);
    });

    test('should has lang property in html', async () => {
      const htmlWithDoc = fs.readFileSync(
        path.join(appDir, 'dist', 'html/sub/index.html'),
        'utf-8',
      );

      expect(htmlWithDoc.includes(`html lang="cn"`)).toBe(true);
    });

    test('should has dir property in body', async () => {
      const htmlWithDoc = fs.readFileSync(
        path.join(appDir, 'dist', 'html/sub/index.html'),
        'utf-8',
      );

      expect(htmlWithDoc.includes(`body dir="ltr"`)).toBe(true);
    });

    test('should has class property in root div', async () => {
      const htmlWithDoc = fs.readFileSync(
        path.join(appDir, 'dist', 'html/sub/index.html'),
        'utf-8',
      );

      expect(htmlWithDoc.includes(`div id="root" class="root"`)).toBe(true);
    });

    test('should has class property in root div', async () => {
      const htmlWithDoc = fs.readFileSync(
        path.join(appDir, 'dist', 'html/sub/index.html'),
        'utf-8',
      );

      expect(htmlWithDoc.includes(`head class="head"`)).toBe(true);
    });

    test('when not set partial html should normal', async () => {
      const normalHtml = fs.readFileSync(
        path.join(appDir, 'dist', 'html/differentProperities/index.html'),
        'utf-8',
      );
      const partialPlaceholder = encodeURIComponent(
        '<!--<?- partials.top ?>-->',
      );
      expect(new RegExp(partialPlaceholder).test(normalHtml)).toBe(false);
    });

    test('should injected partial html content to html', async () => {
      const htmlWithDoc = fs.readFileSync(
        path.join(appDir, 'dist', 'html/sub/index.html'),
        'utf-8',
      );

      expect(
        /<head class="head"><script>window.abc="hjk"<\/script>/.test(
          htmlWithDoc,
        ),
      ).toBe(true);
      expect(
        /<head[\s\S]*<script>console.log\("abc"\)<\/script>[\s\S]*<\/head>/.test(
          htmlWithDoc,
        ),
      ).toBe(true);

      expect(
        /<body[\s\S]*<script>console.log\(abc\)<\/script>[\s\S]*<\/body>/.test(
          htmlWithDoc,
        ),
      ).toBe(true);
    });

    test('should has title in Head', async () => {
      const htmlWithDoc = fs.readFileSync(
        path.join(appDir, 'dist', 'html/sub/index.html'),
        'utf-8',
      );
      expect(htmlWithDoc.includes('<title>test-title</title>')).toBe(true);
    });

    test('should has Script origin script properties', async () => {
      const htmlWithDoc = fs.readFileSync(
        path.join(appDir, 'dist', 'html/sub/index.html'),
        'utf-8',
      );

      expect(
        htmlWithDoc.includes('<script defer="" async="" id="script-has-id">'),
      ).toBe(true);
      // IIFE should worked
      expect(
        htmlWithDoc.includes('console.log("this is a IIFE function")'),
      ).toBe(true);
    });

    test('should not break Script origin script properties', async () => {
      const htmlWithDoc = fs.readFileSync(
        path.join(appDir, 'dist', 'html/sub/index.html'),
        'utf-8',
      );

      expect(
        htmlWithDoc.includes('<script defer="" async="" id="script-has-id2">'),
      ).toBe(true);
      // IIFE should worked
      expect(
        htmlWithDoc.includes('console.log("this is another IIFE function")'),
      ).toBe(true);
    });
  });

  describe('test dev', () => {
    let app: any;
    let appPort: number;
    let errors;
    let browser: Browser;
    let page: Page;
    beforeAll(async () => {
      await curSequenceWait.waitUntil('test-dev');
      appPort = await getPort();
      app = await launchApp(appDir, appPort, {}, {});
      errors = [];
      browser = await puppeteer.launch(launchOptions as any);
      page = await browser.newPage();
      page.on('pageerror', error => {
        errors.push(error.message);
      });
    });
    afterAll(async () => {
      await killApp(app);
      await page.close();
      await browser.close();
      curSequenceWait.done('test-rem');
    });

    test(`should render page test correctly`, async () => {
      await page.goto(`http://localhost:${appPort}/test`, {
        waitUntil: ['networkidle0'],
      });

      const root = await page.$('#root');
      const targetText = await page.evaluate(el => el?.textContent, root);
      expect(targetText?.trim()).toEqual('A');
      expect(errors.length).toEqual(0);
    });

    test(`should render page sub correctly`, async () => {
      await page.goto(`http://localhost:${appPort}/sub`, {
        waitUntil: ['networkidle0'],
      });

      await page.waitForSelector('#root a');
      const root = await page.$('#root');
      const targetText = await page.evaluate(el => el?.textContent, root);
      expect(targetText?.trim()).toEqual('去 A去 B');
      expect(errors.length).toEqual(0);
    });

    test(`should render page sub route a correctly`, async () => {
      await page.goto(`http://localhost:${appPort}/sub/a`, {
        waitUntil: ['networkidle0'],
      });

      await page.waitForSelector('#root a');
      const root = await page.$('#root');
      const targetText = await page.evaluate(el => el?.textContent, root);
      expect(targetText?.trim()).toEqual('Here is page A返回 Home');
      expect(errors.length).toEqual(0);
    });
  });

  describe('fix rem', () => {
    beforeAll(async () => {
      await curSequenceWait.waitUntil('test-rem');
      await modernBuild(appDir, ['-c', 'modern-rem.config.ts']);
    });

    test('should add rem resource correct', async () => {
      const htmlNoDoc = fs.readFileSync(
        path.join(appDir, 'dist-1', 'html/test/index.html'),
        'utf-8',
      );
      expect(htmlNoDoc.includes('/static/js/convert-rem.'));
    });
  });
});
