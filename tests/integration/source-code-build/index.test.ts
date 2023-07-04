import path from 'path';
import getPort from 'get-port';
import puppeteer, { Browser } from 'puppeteer';
import { fs } from '@modern-js/utils';
import {
  launchApp,
  launchOptions,
  killApp,
  sleep,
} from '../../utils/modernTestUtils';

const appDir = path.resolve(__dirname, './app');

jest.setTimeout(1000 * 60 * 2);

describe('source build', () => {
  let app: any;
  let browser: Browser;
  let port: number;
  let card: {
    codeDir: string;
    original: string;
  };
  let utils: {
    codeDir: string;
    original: string;
  };

  beforeAll(async () => {
    port = await getPort();
    app = await launchApp(appDir, port, {});
    browser = await puppeteer.launch(launchOptions as any);
    const cardCompDir = path.join(__dirname, './components/src/card/index.tsx');
    card = {
      codeDir: cardCompDir,
      original: await fs.readFile(cardCompDir, 'utf8'),
    };
    const utilsDir = path.join(__dirname, './utils/src/index.ts');
    utils = {
      codeDir: utilsDir,
      original: await fs.readFile(utilsDir, 'utf8'),
    };
  });
  test('should run successfully', async () => {
    expect(app.exitCode).toBe(null);
    // browser = await puppeteer.launch(launchOptions as any);
    const page = await browser.newPage();
    await page.goto(`http://localhost:${port}`);
    const root = await page.$('#root');
    const targetText = await page.evaluate(el => el?.textContent, root);
    expect(targetText).toMatch('Card Comp Title: App');
    expect(targetText).toMatch('CARD COMP CONTENT:hello world');
  });

  test('update component project code', async () => {
    const newContent = card.original.replaceAll('Card Comp', 'Card-Comp');
    await fs.writeFile(card.codeDir, newContent);
    await sleep(2000);
    const page = await browser.newPage();
    await page.goto(`http://localhost:${port}`);
    const root = await page.$('#root');
    const targetText = await page.evaluate(el => el?.textContent, root);
    // console.info('component', targetText);

    expect(targetText).toMatch('Card-Comp');
    expect(targetText).toMatch('CARD-COMP');
  });

  test('update utils project code', async () => {
    const newContent = `
    export const strAdd = (str1: string, str2: string) => {
      return 'this is utils' + str1 + str2;
    }
    `;
    await fs.writeFile(utils.codeDir, newContent);
    await sleep(2000);
    const page = await browser.newPage();
    await page.goto(`http://localhost:${port}`);
    const root = await page.$('#root');
    const targetText = await page.evaluate(el => el?.textContent, root);
    // console.info('utils', targetText);
    expect(targetText).toMatch('this is utils');
  });

  afterAll(async () => {
    browser.close();
    await killApp(app);
    await fs.writeFile(card.codeDir, card.original);
    await fs.writeFile(utils.codeDir, utils.original);
  });
});
