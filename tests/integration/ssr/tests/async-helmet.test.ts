import http from 'http';
import path, { join } from 'path';
import puppeteer, { type Browser, type Page } from 'puppeteer';
import {
  getPort,
  killApp,
  launchApp,
  launchOptions,
} from '../../../utils/modernTestUtils';

const fixtureDir = path.resolve(__dirname, '../fixtures');

async function basicHelmetUsage(page: Page, appPort: number) {
  const res = await page.goto(`http://localhost:${appPort}/home`, {
    waitUntil: ['networkidle0'],
  });

  const body = await res!.text();

  // Check helmet title is present
  expect(body).toMatch(/<title>Home Page - Async Helmet Test<\/title>/);

  // Check helmet meta tags are present
  expect(body).toMatch(
    /<meta name="description" content="Home page for async helmet test"/,
  );
  expect(body).toMatch(
    /<meta name="keywords" content="react,helmet,async,test"/,
  );

  // Check page content is present
  expect(body).toMatch(/<h1>Home Page<\/h1>/);
  expect(body).toMatch(/<div id="home-content">Home content loaded<\/div>/);
}

async function userPageHelmet(page: Page, appPort: number) {
  const res = await page.goto(`http://localhost:${appPort}/user/1`, {
    waitUntil: ['networkidle0'],
  });

  const body = await res!.text();

  // Check helmet title with dynamic content is present
  expect(body).toMatch(/<title>User: user1 - Async Helmet Test<\/title>/);

  // Check helmet meta tags are present
  expect(body).toMatch(
    /<meta name="description" content="Profile page for user user1"/,
  );
  expect(body).toMatch(/<meta property="og:title" content="user1's Profile"/);

  // Check page content is present
  expect(body).toMatch(/<div id="user-name">Name: user1<\/div>/);
  expect(body).toMatch(/<div id="user-age">Age: 18<\/div>/);
}

async function aboutPageHelmet(page: Page, appPort: number) {
  const res = await page.goto(`http://localhost:${appPort}/about`, {
    waitUntil: ['networkidle0'],
  });

  const body = await res!.text();

  // Check helmet title is present
  expect(body).toMatch(/<title>About - Async Helmet Test<\/title>/);

  // Check helmet meta tags are present
  expect(body).toMatch(
    /<meta name="description" content="About page for async helmet test"/,
  );
  expect(body).toMatch(/<meta property="og:type" content="website"/);

  // Check page content is present
  expect(body).toMatch(/<h1>About Page<\/h1>/);
  expect(body).toMatch(/<div id="about-content">About content loaded<\/div>/);
}

async function productsPageHelmet(page: Page, appPort: number) {
  const res = await page.goto(`http://localhost:${appPort}/products`, {
    waitUntil: ['networkidle0'],
  });

  const body = await res!.text();

  // Check helmet title is present
  expect(body).toMatch(/<title>Products - Async Helmet Test<\/title>/);

  // Check helmet meta tags are present
  expect(body).toMatch(
    /<meta name="description" content="Products page for async helmet test"/,
  );
  expect(body).toMatch(
    /<link rel="canonical" href="http:\/\/localhost\/products"\/>/,
  );

  // Check page content is present
  expect(body).toMatch(/<h1>Products Page<\/h1>/);
  expect(body).toMatch(/<div id="products-list">Products list loaded<\/div>/);
}

async function layoutHelmetContext(page: Page, appPort: number) {
  const res = await page.goto(`http://localhost:${appPort}/home`, {
    waitUntil: ['networkidle0'],
  });

  const body = await res!.text();

  // Check layout-level helmet meta is present
  expect(body).toMatch(
    /<meta name="description" content="Test page for react-helmet-async"/,
  );

  // Check that layout title doesn't override page title
  expect(body).toMatch(/<title>Home Page - Async Helmet Test<\/title>/);
}

async function helmetIsolation(appPort: number) {
  // Test that helmet context is isolated between requests
  const user1Res = await fetch(`http://localhost:${appPort}/user/1`);
  const user1Body = await user1Res.text();

  const user2Res = await fetch(`http://localhost:${appPort}/user/2`);
  const user2Body = await user2Res.text();

  // User 1 should have user1 in title
  expect(user1Body).toMatch(/<title>User: user1 - Async Helmet Test<\/title>/);

  // User 2 should have user2 in title
  expect(user2Body).toMatch(/<title>User: user2 - Async Helmet Test<\/title>/);

  // User 1 should NOT have user2 in title
  expect(user1Body).not.toMatch(/<title>User: user2/);

  // User 2 should NOT have user1 in title
  expect(user2Body).not.toMatch(/<title>User: user1/);
}

describe('Async Helmet SSR', () => {
  let app: any;
  let appPort: number;
  let page: Page;
  let browser: Browser;

  beforeAll(async () => {
    const appDir = join(fixtureDir, 'async-helmet');
    appPort = await getPort();
    app = await launchApp(appDir, appPort, {});

    browser = await puppeteer.launch(launchOptions as any);
    page = await browser.newPage();
  });

  afterAll(async () => {
    if (browser) {
      browser.close();
    }
    if (app) {
      await killApp(app);
    }
  });

  test(`basic helmet usage`, async () => {
    await basicHelmetUsage(page, appPort);
  });

  test(`user page helmet with dynamic content`, async () => {
    await userPageHelmet(page, appPort);
  });

  test(`about page helmet`, async () => {
    await aboutPageHelmet(page, appPort);
  });

  test(`products page helmet with canonical link`, async () => {
    await productsPageHelmet(page, appPort);
  });

  test(`layout helmet context inheritance`, async () => {
    await layoutHelmetContext(page, appPort);
  });

  test(`helmet context isolation between requests`, async () => {
    await helmetIsolation(appPort);
  });
});
