#!/usr/bin/env node --conditions=jsnext:source -r btsm

const path = require('path');

const kProjectRoot = path.resolve(__dirname, '../../..');

require(`${kProjectRoot}/packages/cli/core/src/cli.ts`);
