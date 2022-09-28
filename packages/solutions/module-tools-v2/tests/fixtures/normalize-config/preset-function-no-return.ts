import { defineConfig } from '../../../src';

const fn = (options: any) => {
  console.info(options);
};
export default defineConfig({
  buildPreset: fn as any,
});
