import { defineConfig } from '../../utils';
import Plugin1 from './plugin-1';

export default defineConfig({
  plugins: [Plugin1()],
});
