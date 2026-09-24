import assert from 'node:assert/strict';
import puppeteer from 'puppeteer';

const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox'],
  protocolTimeout: 15000,
});
try {
  const page = await browser.newPage();
  page.on('pageerror', error => console.error(error));
  await page.goto(process.argv[2]);
  await page.waitForFunction(
    () =>
      document
        .querySelector('output')
        ?.textContent?.includes('initial tool result'),
    { polling: 100, timeout: 15000 },
  );
  const frame = page.frames().find(item => item.parentFrame());
  assert.ok(frame);
  await frame.waitForSelector('section[data-alias="alias-from-modern"]');
  assert.equal(
    await frame.$eval('h1', node => node.textContent),
    'Hello, Ada!',
  );
  assert.equal(
    await frame.$eval('section', node => node.getAttribute('data-build')),
    'configured-by-modern',
  );
  assert.equal(
    await frame.$eval('section', node => getComputedStyle(node).color),
    'rgb(12, 34, 56)',
  );
  assert.equal(
    await frame.evaluate(() => document.documentElement.dataset.runtime),
    'ready',
  );
  assert.equal(
    await frame.evaluate(() => document.documentElement.dataset.preentry),
    'ready',
  );
  await frame.$eval('button', button => button.click());
  await frame.waitForFunction(
    () => document.querySelector('h1')?.textContent === 'Hello, Modern.js!',
    { polling: 100, timeout: 15000 },
  );
  console.log(
    'PASS: sandbox UI, CSS Modules, alias, globalVars, preEntry, runtime plugin and tool call',
  );
} finally {
  await browser.close();
}
