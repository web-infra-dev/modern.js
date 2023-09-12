import { join } from 'path';

export { start, build, bail, getConfig } from './build';

export * from './types';

export const corePresets = [join(__dirname, './preset.js')];
