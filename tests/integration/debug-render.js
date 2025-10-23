const puppeteer = require('puppeteer');

async function debug() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  page.on('console', msg => console.log('Browser log:', msg.text()));
  page.on('pageerror', error => console.error('Page error:', error.message));

  // Try loading the host app (assuming it's running on port from test)
  const hostPort = 3000; // Default from config

  try {
    await page.goto(`http://localhost:${hostPort}/`, {
      waitUntil: ['networkidle0', 'domcontentloaded'],
      timeout: 10000,
    });

    const html = await page.content();
    console.log('\n=== PAGE HTML ===');
    console.log(html.substring(0, 2000));
    console.log('\n=== BODY TEXT ===');
    const bodyText = await page.$eval('body', el => el.textContent);
    console.log(bodyText);
  } catch (error) {
    console.error('Failed to load page:', error.message);
  }

  await browser.close();
}

debug();
