#!/usr/bin/env node --conditions=jsnext:source -r btsm

const path = require('path');

const kProjectRoot = path.resolve(__dirname, '../../..');

process.env.CORE_INIT_OPTION_FILE = path.resolve(__dirname, '../src/cli_core_init.js');

require(`${kProjectRoot}/packages/cli/core/src/cli.ts`);
