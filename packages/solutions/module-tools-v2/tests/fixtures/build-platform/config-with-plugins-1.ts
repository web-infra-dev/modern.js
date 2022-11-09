import { defineConfig } from '../../utils';
import Plugin5 from './plugin-5';
import Plugin6 from './plugin-6';

export default defineConfig({
  plugins: [Plugin5(), Plugin6()],
});
