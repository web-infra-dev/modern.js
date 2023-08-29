import { join } from 'path';

export { start, build, bail } from './build';

export const corePresets = [join(__dirname, './preset.js')];
