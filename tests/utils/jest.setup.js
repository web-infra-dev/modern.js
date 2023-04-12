const { setDefaultOptions } = require('expect-puppeteer');

setDefaultOptions({ timeout: 30000 });

// eslint-disable-next-line no-undef
jest.setTimeout(1000 * 60 * 5);
