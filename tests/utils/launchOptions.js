const launchOptions = {
  headless: 'new',
  dumpio: true,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--no-first-run',
    '--no-zygote',
    '--disable-gpu',
    '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows',
    '--disable-renderer-backgrounding',
    '--disable-features=TranslateUI',
    '--disable-ipc-flooding-protection',
    '--disable-background-networking',
    '--disable-sync',
    '--disable-default-apps',
    '--disable-extensions',
    '--disable-plugins',
    '--disable-translate',
    '--hide-scrollbars',
    '--metrics-recording-only',
    '--mute-audio',
    '--no-default-browser-check',
    '--safebrowsing-disable-auto-update',
    '--disable-logging',
    '--disable-permissions-api',
    '--disable-notifications',
    '--disable-web-security',
    '--disable-features=VizDisplayCompositor',
    '--disable-dbus',
    '--disable-oom-score-adjustment',
  ],
  // Fix protocol timed out
  // see: https://github.com/puppeteer/puppeteer/issues/9927
  protocolTimeout: 0,
};

module.exports = {
  launchOptions,
};
