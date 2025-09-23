const launchOptions = {
  headless: 'new',
  dumpio: true,
  args: [
    '--no-sandbox',
    // Suppress D-Bus connection warnings
    '--log-level=3',
    '--v=0',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--disable-software-rasterizer',
    '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows',
    '--disable-renderer-backgrounding',
    '--disable-features=TranslateUI',
    '--disable-ipc-flooding-protection',
    // Suppress OOM score adjustment warnings
    '--no-zygote',
    '--disable-setuid-sandbox',
    // Additional flags to reduce noise
    '--disable-logging',
    '--disable-extensions',
    '--disable-plugins',
    '--disable-sync',
    '--disable-translate',
    '--hide-scrollbars',
    '--mute-audio',
    '--no-first-run',
    '--disable-background-networking',
    '--disable-component-extensions-with-background-pages',
    '--disable-default-apps',
    '--disable-hang-monitor',
    '--disable-prompt-on-repost',
    '--disable-web-security',
    '--metrics-recording-only',
    '--no-default-browser-check',
    '--safebrowsing-disable-auto-update',
    '--enable-automation',
    '--password-store=basic',
    '--use-mock-keychain',
  ],
  env: {
    ...process.env,
    // Prevent Chromium from attempting to use D-Bus
    DBUS_SESSION_BUS_ADDRESS: 'unix:path=/dev/null',
    DBUS_SYSTEM_BUS_ADDRESS: 'unix:path=/dev/null',
  },
  // Fix protocol timed out
  // see: https://github.com/puppeteer/puppeteer/issues/9927
  protocolTimeout: 0,
};

module.exports = {
  launchOptions,
};
