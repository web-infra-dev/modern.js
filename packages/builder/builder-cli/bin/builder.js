#!/usr/bin/env node
const { logger } = require('@modern-js/utils/logger');
const { run } = require('../dist');

async function main() {
  try {
    await run();
  } catch (err) {
    logger.error(err);
  }
}

main();
