#!/usr/bin/env node
import { createRequire } from 'module';
import { INTERNAL_DOC_TOOLS_PLUGINS } from '@modern-js/utils';

const require = createRequire(import.meta.url);

require('@modern-js/core/runBin').run({
  internalPlugins: {
    cli: INTERNAL_DOC_TOOLS_PLUGINS,
  },
});
