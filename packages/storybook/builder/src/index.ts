import { join } from 'path';

export { start, build, bail } from './build';

export * from './types';

export const corePresets = [join(__dirname, './preset.js')];
