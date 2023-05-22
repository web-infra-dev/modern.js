#!/usr/bin/env node
const { INTERNAL_DOC_TOOLS_PLUGINS } = require('@modern-js/utils');

require('@modern-js/core/runBin').run({
  internalPlugins: {
    cli: INTERNAL_DOC_TOOLS_PLUGINS,
  },
});
