#!/usr/bin/env node
const { logger } = require('@modern-js/utils/logger');
const gradient = require('@modern-js/utils/gradient-string');

async function main() {
  const { version } = require('../package.json');
  logger.log(`  ${gradient.cristal(`Modern.js Builder v${version}`)}\n`);

  try {
    const { runCli } = require('@modern-js/builder/cli');
    await runCli();
  } catch (err) {
    logger.error(err);
  }
}

main();
