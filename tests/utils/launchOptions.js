const launchOptions = {
  headless: 'new',
  dumpio: true,
  args: ['--no-sandbox'],
  // Fix protocol timed out
  // see: https://github.com/puppeteer/puppeteer/issues/9927
  protocolTimeout: 0,
};

module.exports = {
  launchOptions,
};
