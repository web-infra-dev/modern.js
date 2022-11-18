import { defineConfig } from '../../utils';
import DevPlugin1 from './plugin-1';

export default defineConfig({
  plugins: [DevPlugin1()],
});
