#!/usr/bin/env node
if (!__dirname.includes('node_modules') && !process.env.NO_STACK) {
  try {
    require('source-map-support').install();
  } catch (err) {}
}
require('./dist/index.js').run();
