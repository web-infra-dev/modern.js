import { defineConfig } from '../../utils';

const buildPreset = () => {
  console.info('return nothing');
};

export default defineConfig({
  buildPreset: buildPreset as any,
});
