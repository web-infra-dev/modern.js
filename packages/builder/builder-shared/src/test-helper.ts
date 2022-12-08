import { Plugins } from './types';

// eslint-disable-next-line @typescript-eslint/no-empty-function
const setup = () => {};

export const mockBuilderPlugins: Plugins = {
  cleanOutput: () =>
    Promise.resolve({
      name: 'builder-plugin-clean-output',
      setup,
    }),
  startUrl: () =>
    Promise.resolve({
      name: 'builder-plugin-start-url',
      setup,
    }),
};
