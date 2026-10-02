import { appTools, defineConfig } from '@modern-js/app-tools';
import { ssgPlugin } from '@modern-js/plugin-ssg';
const shouldSSG = (entry: string) => entry === "main";

export default defineConfig({
  output: { ssgByEntries: { main: shouldSSG } },
  plugins: [appTools(), ssgPlugin()],
});
