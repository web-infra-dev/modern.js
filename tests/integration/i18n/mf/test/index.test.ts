import path from 'path';
import puppeteer, { type Browser, type Page } from 'puppeteer';
import {
  killApp,
  launchApp,
  launchOptions,
} from '../../../../utils/modernTestUtils';
import { clearI18nTestState, conditionalTest } from '../../test-utils';

async function waitForAppReady(port: number, maxRetries = 30) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(`http://localhost:${port}`, {
        method: 'HEAD',
        signal: AbortSignal.timeout(2000),
      });
      if (response.ok || response.status < 500) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        return;
      }
    } catch (error) {}
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  throw new Error(`Application on port ${port} did not become ready`);
}

const componentProviderDir = path.resolve(
  __dirname,
  '../mf-component-provider',
);
const appProviderDir = path.resolve(__dirname, '../mf-app-provider');
const consumerDir = path.resolve(__dirname, '../mf-consumer');

const COMPONENT_PROVIDER_PORT = 3006;
const APP_PROVIDER_PORT = 3005;
const CONSUMER_PORT = 3007;

describe('mf-i18n-tests', () => {
  let componentProviderApp: unknown;
  let appProviderApp: unknown;
  let componentProviderPage: Page;
  let componentProviderBrowser: Browser;
  let appProviderPage: Page;
  let appProviderBrowser: Browser;

  beforeAll(async () => {
    jest.setTimeout(1000 * 60 * 5);
    componentProviderApp = await launchApp(
      componentProviderDir,
      COMPONENT_PROVIDER_PORT,
    );
    await waitForAppReady(COMPONENT_PROVIDER_PORT);

    appProviderApp = await launchApp(appProviderDir, APP_PROVIDER_PORT);
    await waitForAppReady(APP_PROVIDER_PORT);

    componentProviderBrowser = await puppeteer.launch(launchOptions as any);
    componentProviderPage = await componentProviderBrowser.newPage();
    await componentProviderPage.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
    });

    appProviderBrowser = await puppeteer.launch(launchOptions as any);
    appProviderPage = await appProviderBrowser.newPage();
    await appProviderPage.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
    });
  });

  afterAll(async () => {
    if (componentProviderBrowser) {
      await componentProviderBrowser.close();
    }
    if (appProviderBrowser) {
      await appProviderBrowser.close();
    }
    if (componentProviderApp) {
      await killApp(componentProviderApp);
    }
    if (appProviderApp) {
      await killApp(appProviderApp);
    }
  });

  describe('mf-component-provider standalone', () => {
    beforeEach(async () => {
      await clearI18nTestState(componentProviderPage);
    });

    conditionalTest('should render home page with i18n correctly', async () => {
      await componentProviderPage.goto(
        `http://localhost:${COMPONENT_PROVIDER_PORT}/en`,
        {
          waitUntil: ['networkidle0'],
          timeout: 50000,
        },
      );
      const root = await componentProviderPage.$('#key');
      const targetText = await componentProviderPage.evaluate(
        el => el?.textContent,
        root,
      );
      expect(targetText?.trim()).toEqual('Hello World(provider)');
    });

    conditionalTest(
      'should render about page with i18n correctly',
      async () => {
        await componentProviderPage.goto(
          `http://localhost:${COMPONENT_PROVIDER_PORT}/en/about`,
          {
            waitUntil: ['networkidle0'],
            timeout: 50000,
          },
        );
        const root = await componentProviderPage.$('#about');
        const targetText = await componentProviderPage.evaluate(
          el => el?.textContent,
          root,
        );
        expect(targetText?.trim()).toEqual('About(provider)');
      },
    );

    conditionalTest('should support zh locale', async () => {
      await componentProviderPage.goto(
        `http://localhost:${COMPONENT_PROVIDER_PORT}/zh`,
        {
          waitUntil: ['networkidle0'],
          timeout: 50000,
        },
      );
      const root = await componentProviderPage.$('#key');
      const targetText = await componentProviderPage.evaluate(
        el => el?.textContent,
        root,
      );
      expect(targetText?.trim()).toEqual('你好，世界(provider)');
    });
  });

  describe('mf-app-provider standalone', () => {
    beforeEach(async () => {
      await clearI18nTestState(appProviderPage);
    });

    conditionalTest('should render home page correctly', async () => {
      await appProviderPage.setCookie({
        name: 'i18next',
        value: 'en',
        domain: 'localhost',
        path: '/',
      });
      await appProviderPage.goto(`http://localhost:${APP_PROVIDER_PORT}`, {
        waitUntil: ['networkidle0'],
        timeout: 50000,
      });
      const body = await appProviderPage.$('body');
      expect(body).toBeTruthy();
    });

    conditionalTest('should render test page with i18n correctly', async () => {
      await appProviderPage.goto(
        `http://localhost:${APP_PROVIDER_PORT}/en/test`,
        {
          waitUntil: ['networkidle0'],
          timeout: 50000,
        },
      );
      const root = await appProviderPage.$('#key');
      const targetText = await appProviderPage.evaluate(
        el => el?.textContent,
        root,
      );
      expect(targetText?.trim()).toEqual('Hello World(provider)');
    });

    conditionalTest('should support zh locale', async () => {
      await appProviderPage.goto(
        `http://localhost:${APP_PROVIDER_PORT}/zh/test`,
        {
          waitUntil: ['networkidle0'],
          timeout: 50000,
        },
      );
      const root = await appProviderPage.$('#key');
      const targetText = await appProviderPage.evaluate(
        el => el?.textContent,
        root,
      );
      expect(targetText?.trim()).toEqual('你好，世界(provider)');
    });

    conditionalTest(
      'should render custom page with i18n correctly',
      async () => {
        await appProviderPage.goto(`http://localhost:${APP_PROVIDER_PORT}`, {
          waitUntil: ['networkidle0'],
          timeout: 50000,
        });
        await appProviderPage.evaluate(() => {
          localStorage.setItem('i18nextLng', 'en');
          localStorage.setItem('i18next', 'en');
        });
        await appProviderPage.goto(
          `http://localhost:${APP_PROVIDER_PORT}/custom`,
          {
            waitUntil: ['networkidle0'],
            timeout: 50000,
          },
        );
        const root = await appProviderPage.$('#key');
        const targetText = await appProviderPage.evaluate(
          el => el?.textContent,
          root,
        );
        expect(targetText?.trim()).toEqual('Hello World(provider-custom)');
      },
    );

    conditionalTest('should support zh locale for custom page', async () => {
      await appProviderPage.setCookie({
        name: 'i18next',
        value: 'zh',
        domain: 'localhost',
        path: '/',
      });
      await appProviderPage.goto(
        `http://localhost:${APP_PROVIDER_PORT}/custom`,
        {
          waitUntil: ['networkidle0'],
          timeout: 50000,
        },
      );
      const root = await appProviderPage.$('#key');
      const targetText = await appProviderPage.evaluate(
        el => el?.textContent,
        root,
      );
      expect(targetText?.trim()).toEqual('你好，世界(provider-custom)');
    });
  });

  describe('mf-consumer with mf-component', () => {
    let consumerApp: unknown;
    let page: Page;
    let browser: Browser;

    beforeAll(async () => {
      jest.setTimeout(1000 * 60 * 3);
      consumerApp = await launchApp(consumerDir, CONSUMER_PORT);
      await waitForAppReady(CONSUMER_PORT);

      browser = await puppeteer.launch(launchOptions as any);
      page = await browser.newPage();
      await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9',
      });
    });

    beforeEach(async () => {
      await clearI18nTestState(page);
    });

    afterAll(async () => {
      if (browser) {
        await browser.close();
      }
      if (consumerApp) {
        await killApp(consumerApp);
      }
    });

    conditionalTest('should load remote component correctly', async () => {
      await page.goto(`http://localhost:${CONSUMER_PORT}/en`, {
        waitUntil: ['networkidle0'],
        timeout: 60000,
      });
      const consumerKey = await page.$('#key');
      const consumerText = await page.evaluate(
        el => el?.textContent,
        consumerKey,
      );
      expect(consumerText?.trim()).toContain('Hello World(consumer)');
      await page.waitForSelector('#about', { timeout: 30000 });
      const remoteComponent = await page.$('#about');
      expect(remoteComponent).toBeTruthy();
      await page.waitForFunction(
        () => {
          const aboutEl = document.querySelector('#about');
          if (!aboutEl) return false;
          const paragraphs = aboutEl.querySelectorAll('p');
          return paragraphs.length >= 2;
        },
        { timeout: 30000 },
      );
      const remoteText2Content = await page.evaluate(() => {
        const aboutEl = document.querySelector('#about');
        if (!aboutEl) return null;
        const paragraphs = aboutEl.querySelectorAll('p');
        if (paragraphs.length >= 2) {
          return paragraphs[1].textContent?.trim() || null;
        }
        return null;
      });
      expect(remoteText2Content).toBeTruthy();
      expect(remoteText2Content?.trim()).toEqual('About(consumer)');
    });

    conditionalTest(
      'should support zh locale with remote component',
      async () => {
        await page.goto(`http://localhost:${CONSUMER_PORT}/zh`, {
          waitUntil: ['networkidle0'],
          timeout: 60000,
        });
        const consumerKey = await page.$('#key');
        const consumerText = await page.evaluate(
          el => el?.textContent,
          consumerKey,
        );
        expect(consumerText?.trim()).toContain('你好，世界(consumer)');
        await page.waitForSelector('#about', { timeout: 30000 });
        await page.waitForFunction(
          () => {
            const aboutEl = document.querySelector('#about');
            if (!aboutEl) return false;
            const paragraphs = aboutEl.querySelectorAll('p');
            return paragraphs.length >= 2;
          },
          { timeout: 30000 },
        );
        const remoteText2Content = await page.evaluate(() => {
          const aboutEl = document.querySelector('#about');
          if (!aboutEl) return null;
          const paragraphs = aboutEl.querySelectorAll('p');
          if (paragraphs.length >= 2) {
            return paragraphs[1].textContent?.trim() || null;
          }
          return null;
        });
        expect(remoteText2Content).toBeTruthy();
        expect(remoteText2Content?.trim()).toEqual('关于(consumer)');
      },
    );
  });

  describe('mf-consumer with mf-app', () => {
    let consumerApp: unknown;
    let page: Page;
    let browser: Browser;

    beforeAll(async () => {
      jest.setTimeout(1000 * 60 * 3);
      consumerApp = await launchApp(consumerDir, CONSUMER_PORT);
      await waitForAppReady(CONSUMER_PORT);

      browser = await puppeteer.launch(launchOptions as any);
      page = await browser.newPage();
      await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9',
      });
    });

    beforeEach(async () => {
      await clearI18nTestState(page);
    });

    afterAll(async () => {
      if (browser) {
        await browser.close();
      }
      if (consumerApp) {
        await killApp(consumerApp);
      }
    });

    conditionalTest('should load remote app correctly', async () => {
      await page.goto(`http://localhost:${CONSUMER_PORT}/en/remote`, {
        waitUntil: ['networkidle0'],
        timeout: 60000,
      });
      const remoteAppTitle = await page.$('h2');
      const titleText = await page.evaluate(
        el => el?.textContent,
        remoteAppTitle,
      );
      expect(titleText?.trim()).toEqual('远程应用页面');
      const body = await page.$('body');
      expect(body).toBeTruthy();
    });

    conditionalTest('should support zh locale with remote app', async () => {
      await page.goto(`http://localhost:${CONSUMER_PORT}/zh/remote`, {
        waitUntil: ['networkidle0'],
        timeout: 60000,
      });
      const remoteAppTitle = await page.$('h2');
      const titleText = await page.evaluate(
        el => el?.textContent,
        remoteAppTitle,
      );
      expect(titleText?.trim()).toEqual('远程应用页面');
    });

    conditionalTest('should load remote-2 app correctly', async () => {
      await page.goto(`http://localhost:${CONSUMER_PORT}/en/remote-2`, {
        waitUntil: ['networkidle0'],
        timeout: 60000,
      });
      const remoteAppTitle = await page.$('h2');
      const titleText = await page.evaluate(
        el => el?.textContent,
        remoteAppTitle,
      );
      expect(titleText?.trim()).toEqual('远程应用页面');
      await page.waitForSelector('#key', { timeout: 30000 });
      const remoteKey = await page.$('#key');
      const remoteText = await page.evaluate(el => el?.textContent, remoteKey);
      expect(remoteText?.trim()).toEqual('Hello World(provider-custom)');
    });

    conditionalTest('should support zh locale with remote-2 app', async () => {
      await page.goto(`http://localhost:${CONSUMER_PORT}/zh/remote-2`, {
        waitUntil: ['networkidle0'],
        timeout: 60000,
      });
      const remoteAppTitle = await page.$('h2');
      const titleText = await page.evaluate(
        el => el?.textContent,
        remoteAppTitle,
      );
      expect(titleText?.trim()).toEqual('远程应用页面');
      await page.waitForSelector('#key', { timeout: 30000 });
      const remoteKey = await page.$('#key');
      const remoteText = await page.evaluate(el => el?.textContent, remoteKey);
      expect(remoteText?.trim()).toEqual('你好，世界(provider-custom)');
    });
  });
});
