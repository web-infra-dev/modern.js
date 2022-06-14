#!/usr/bin/env zx
import { $ } from 'zx';

async function runAllExample() {
  await $`pnpm --parallel --filter "@cypress-test/*" run dev`;
}

runAllExample();
