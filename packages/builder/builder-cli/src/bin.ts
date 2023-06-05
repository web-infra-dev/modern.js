#!/usr/bin/env node
import { logger } from '@modern-js/utils/logger';
import { run } from '.';

async function main() {
  try {
    await run();
  } catch (err) {
    logger.error(err as Error);
  }
}

main();
