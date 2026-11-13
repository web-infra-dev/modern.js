const assert = require('node:assert/strict');
const { testRequire } = require('./packages.cjs');

async function verifyBrowser(baseURL) {
  const puppeteer = testRequire('puppeteer');
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const diagnostics = new WeakMap();
  async function control(pathname) {
    const response = await fetch(baseURL + pathname);
    assert.equal(response.status, 200, await response.clone().text());
    return response.json();
  }
  async function interact(page, version) {
    try {
      await page.waitForFunction(
        () =>
          document.querySelector('#remote-counter')?.dataset.hydrated ===
          'true',
      );
    } catch (error) {
      console.error(
        'Hydration failed',
        version,
        diagnostics.get(page),
        await page.evaluate(() => ({
          url: location.href,
          counter: document.querySelector('#remote-counter')?.outerHTML,
          release: document.querySelector('[data-modern-mf-release]')
            ?.textContent,
          text: document.body.textContent?.slice(0, 1000),
        })),
      );
      throw error;
    }
    assert.equal(
      await page.$eval('#remote-counter', node => node.textContent),
      `${version}:0`,
    );
    await page.click('#remote-counter');
    await page.waitForFunction(
      value => document.querySelector('#remote-counter')?.textContent === value,
      {},
      `${version}:1`,
    );
  }
  async function newPage() {
    const page = await browser.newPage();
    const errors = [];
    diagnostics.set(page, errors);
    page.on('pageerror', error => errors.push(String(error)));
    page.on('requestfailed', request =>
      errors.push(`${request.url()}: ${request.failure()?.errorText}`),
    );
    page.on('console', message => {
      if (message.type() === 'error') errors.push(message.text());
    });
    return { page, errors };
  }
  try {
    const oldHTML = await (await fetch(baseURL)).text();
    assert.match(oldHTML, /v1/);
    const current = await newPage();
    await current.page.goto(baseURL, { waitUntil: 'load' });
    await interact(current.page, 'v1');
    const updated = await control('/__update?v=v2');
    assert.equal(updated.mode, 'application');
    assert.equal(
      await current.page.$eval('#remote-counter', node => node.textContent),
      'v1:1',
    );
    await current.page.goto(baseURL, { waitUntil: 'load' });
    await interact(current.page, 'v2');
    assert.deepEqual(current.errors, []);
    await current.page.close();

    const old = await newPage();
    // Serve the saved release over real HTTP so Chrome retains the response's
    // address space when it fetches the provider on another loopback port.
    const saved = await old.page.goto(`${baseURL}/?savedRelease=1`, {
      waitUntil: 'load',
    });
    assert.match(await saved.text(), /v1/);
    await interact(old.page, 'v1');
    assert.deepEqual(old.errors, []);
    await old.page.close();

    await control('/__update?v=v2');
    assert.equal((await control('/__hold-update')).phase, 'updating');
    const gated = await browser.newPage();
    const loader = gated.waitForResponse(response =>
      response.url().includes('__loader='),
    );
    await gated.goto(`${baseURL}/?updatePolicy=csr`, { waitUntil: 'load' });
    const rejected = await loader;
    assert.equal(rejected.status(), 503);
    assert.match(
      await rejected.text(),
      /CSR fallback requires an HTML navigation/,
    );
    assert.equal(await gated.$('#remote-counter'), null);
    await control('/__release-update');
    await gated.goto(baseURL, { waitUntil: 'load' });
    await interact(gated, 'v1');
    await gated.close();

    await control('/__update?v=v2');
    await control('/__hold-update');
    const shell = await fetch(`${baseURL}/client?updatePolicy=csr`);
    assert.equal(shell.headers.get('x-modernjs-render'), 'client');
    assert.equal(shell.headers.get('cache-control'), 'no-store');
    const shellHTML = await shell.text();
    assert.equal(shellHTML.includes('id="remote-counter"'), false);
    const release = JSON.parse(
      shellHTML.match(/data-modern-mf-release>(.*?)<\/script>/)[1],
    );
    assert.match(release.remotes[0].entry, /\/v2\//);
    const csr = await newPage();
    await csr.page.goto(`${baseURL}/client?updatePolicy=csr`, {
      waitUntil: 'load',
    });
    await interact(csr.page, 'v2');
    assert.deepEqual(csr.errors, []);
    await csr.page.close();
    await control('/__release-update');
    assert.match(await (await fetch(baseURL)).text(), /v1/);
    console.log(
      'Browser acceptance passed: paired releases, old HTML hydration and update-time CSR',
    );
  } finally {
    await fetch(`${baseURL}/__release-update`).catch(() => {});
    await browser.close();
  }
}

module.exports = { verifyBrowser };
