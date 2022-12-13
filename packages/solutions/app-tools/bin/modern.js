#!/usr/bin/env node
const {
  INTERNAL_APP_TOOLS_PLUGINS,
  INTERNAL_SERVER_PLUGINS,
} = require('@modern-js/utils');

require('@modern-js/core/runBin').run({
  internalPlugins: {
    cli: INTERNAL_APP_TOOLS_PLUGINS,
    server: INTERNAL_SERVER_PLUGINS,
  },
  toolsType: 'app-tools',
});
