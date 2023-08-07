#!/usr/bin/env node

require('@modern-js/core/runBin').run({
  initialLog: `@modern-js/monorepo-tools v${
    require('../package.json').version
  }`,
});
