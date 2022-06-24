/* eslint-disable no-undef */
const path = require('path');
const { resolve } = require('path');
const {
  clearBuildDist,
  getPort,
  launchApp,
  killApp,
} = require('../../../utils/modernTestUtils');

const fixtures = path.resolve(__dirname, '../fixtures');

afterAll(() => {
  clearBuildDist(fixtures);
});

describe('use twin.macro', () => {
  it(`should show style by use tailwindcss theme`, async () => {
    const appDir = resolve(fixtures, 'twin.macro');

    const port = await getPort();

    const app = await launchApp(appDir, port);

    await page.goto(`http://localhost:${port}`);

    const textColor = await page.$eval('p', p =>
      window.getComputedStyle(p).getPropertyValue('color'),
    );

    expect(textColor).toBe('rgb(255, 0, 0)');

    await killApp(app);
  });
});
/* eslint-enable no-undef */
