const { setDefaultOptions } = require('expect-puppeteer');

setDefaultOptions({ timeout: 30000 });

jest.setTimeout(1000 * 60 * 5);

jest.retryTimes(1);
