#!/usr/bin/env zx
const { $ } = require('zx');
const killPort = require('kill-port');
const { exampleInfo } = require('../utils/testCase');

const ports = Object.keys(exampleInfo).map(key => exampleInfo[key].port);

async function runAllExample() {
  await Promise.all(ports.map(port => killPort(port)));
  await $`pnpm --parallel --filter "@cypress-test/*" run dev`;
}

runAllExample();
