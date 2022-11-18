import { defineConfig } from '../../utils';
import Plugin3 from './plugin-3';
import Plugin4 from './plugin-4';

export default defineConfig({
  plugins: [Plugin3(), Plugin4()],
});
