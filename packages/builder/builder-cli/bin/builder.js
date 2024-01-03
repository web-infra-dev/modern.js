#!/usr/bin/env node
const { logger } = require('@modern-js/utils/logger');

async function main() {
  const { version } = require('../package.json');
  logger.greet(`  ${`Modern.js Builder v${version}`}\n`);

  logger.warn(
    '@modern-js/builder-cli is no longer maintained, please use rsbuild(https://rsbuild.dev/) instead.',
  );

  try {
    const { runCli } = require('@modern-js/builder/cli');
    await runCli();
  } catch (err) {
    logger.error(err);
  }
}

main();
