#!/usr/bin/env zx
const { $ } = require('zx');

async function runAllExample() {
  await $`pnpm --parallel --filter "@cypress-test/*" run dev`;
}

runAllExample();
