#!/usr/bin/env node
/**
 * modified from https://github.com/pnpm/only-allow
 * license at https://github.com/pnpm/only-allow/blob/master/LICENSE
 */

function whichPMRuns() {
  if (!process.env.npm_config_user_agent) {
    return undefined;
  }
  const userAgent = process.env.npm_config_user_agent;
  const pmSpec = userAgent.split(' ')[0];
  const separatorPos = pmSpec.lastIndexOf('/');
  const name = pmSpec.substring(0, separatorPos);
  return {
    name: name === 'npminstall' ? 'cnpm' : name,
    version: pmSpec.substring(separatorPos + 1),
  };
}

const usedPM = whichPMRuns();
if (usedPM && usedPM.name !== 'pnpm') {
  console.warn(`
  Please use "pnpm" in this project.
  If you don't have pnpm, install it via "npm i -g pnpm".
  For more details, go to https://pnpm.js.org/
`);
  // eslint-disable-next-line no-process-exit
  process.exit(1);
}
