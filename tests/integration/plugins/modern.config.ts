import { defineConfig } from '@modern-js/app-tools';

const pluginModern = () => {
  return {
    name: 'pluginModern',
    setup() {
      console.log('run plugin Modern');
      return {};
    },
  };
};

const pluginInner = () => {
  return {
    name: 'pluginInner',
    usePlugins: [pluginModern()],
    pre: ['pluginModern'],
    weight: -1,
    setup() {
      console.log('run plugin Inner');
      return {};
    },
  };
};

const pluginCustom = () => {
  return {
    name: 'pluginCustom',
    post: ['pluginInner'],
    setup() {
      console.log('run plugin Custom');
      return {};
    },
  };
};

export default defineConfig({
  plugins: [pluginInner(), pluginCustom()],
});
