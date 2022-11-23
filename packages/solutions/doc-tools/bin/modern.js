#!/usr/bin/env node
<<<<<<< HEAD
import { createRequire } from 'module';
import { INTERNAL_DOC_TOOLS_PLUGINS } from '@modern-js/utils';

const require = createRequire(import.meta.url);

require('@modern-js/core/runBin').run({
  internalPlugins: {
    cli: INTERNAL_DOC_TOOLS_PLUGINS,
  },
});
=======
import('@modern-js/core/bin');
>>>>>>> 48910dbf71 (feat: init doc tools and doc core)
