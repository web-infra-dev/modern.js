const { execSync } = require('node:child_process');

// The release pipeline already uses PUPPETEER_SKIP_DOWNLOAD to skip test
// browser downloads. Honor that flag here alongside Playwright's own flag.
const skipDownload = [
  process.env.PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD,
  process.env.PUPPETEER_SKIP_DOWNLOAD,
].some(value => value === '1' || value === 'true');

if (skipDownload) {
  console.log('Skipping Playwright browser download.');
} else {
  execSync('playwright install chromium', { stdio: 'inherit' });
}
