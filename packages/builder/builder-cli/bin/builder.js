#!/usr/bin/env node
const { logger } = require('@modern-js/utils/logger');
const { runCli } = require('@modern-js/builder/cli');

async function main() {
  try {
    await runCli();
  } catch (err) {
    logger.error(err);
  }
}

main();
