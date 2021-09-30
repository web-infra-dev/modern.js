module.exports = {
  launch: {
    dumpio: true,
    headless: process.env.HEADLESS !== 'false',
    args: ['--disable-infobars', '--no-sandbox', '--disable-setuid-sandbox'],
  },
  browserContext: 'default',
  server: {
    command: 'npm run serve:fixture',
    port: 8088,
  },
};
