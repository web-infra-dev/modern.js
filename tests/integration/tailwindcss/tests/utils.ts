import path from 'path';
import { fs, glob } from '@modern-js/utils';
import puppeteer from 'puppeteer';
import {
  getPort,
  killApp,
  launchApp,
  launchOptions,
} from '../../../utils/modernTestUtils';

export const fixtures = path.resolve(__dirname, '../fixtures');

const { readdirSync, readFileSync, copySync } = fs;

export const getCssFiles = (appDir: string) =>
  readdirSync(path.resolve(appDir, 'dist/static/css')).filter(filepath =>
    /\.css$/.test(filepath),
  );

export const readCssFile = (appDir: string, filename: string) =>
  readFileSync(path.resolve(appDir, `dist/static/css/${filename}`), 'utf8');

export const copyModules = (appDir: string) => {
  copySync(
    path.resolve(appDir, '_node_modules'),
    path.resolve(appDir, 'node_modules'),
  );
};

export const getCssMaps = (appDir: string) =>
  readdirSync(path.resolve(appDir, 'dist/static/css')).filter(filepath =>
    /\.css\.map$/.test(filepath),
  );

export const getPreCssFiles = (appDir: string, ext: string) =>
  glob
    .sync(path.resolve(appDir, 'dist/**/*'))
    .filter(filepath => new RegExp(`\\.${ext}$`).test(filepath));

export async function launchAppWithPage(appDir: string) {
  const port = await getPort();
  const app = await launchApp(appDir, port);
  const browser = await puppeteer.launch(launchOptions as any);
  const page = await browser.newPage();

  await page.goto(`http://localhost:${port}`, {
    waitUntil: 'networkidle0',
    timeout: 10000,
  });

  return {
    app,
    page,
    async clear() {
      await killApp(app);
      await page.close();
      await browser.close();
    },
  };
}
