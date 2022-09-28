import { defineConfig } from '../../../src';

export default defineConfig({
  buildPreset({ preset }) {
    return preset.NPM_COMPONENT.map(config => {
      config.target = 'es2015';
      return config;
    });
  },
});
