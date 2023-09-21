import type { SetupClientOptions } from '@modern-js/devtools-kit';
import { mountDevTools } from '@modern-js/devtools-mount';
import { parseQuery } from 'ufo';

const opts = parseQuery(__resourceQuery);

mountDevTools(opts as SetupClientOptions);
