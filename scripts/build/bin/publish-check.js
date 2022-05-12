#!/usr/bin/env node
const { checkExports } = require('../src/check-exports');
const { onlyAllowPnpm } = require('../src/only-allow-pnpm');

onlyAllowPnpm();
checkExports();
