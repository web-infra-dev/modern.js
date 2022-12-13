import { Plugins } from './types';

// eslint-disable-next-line @typescript-eslint/no-empty-function
const setup = () => {};

const genMockPlugin = (name: string) => () =>
  Promise.resolve({
    name,
    setup,
  });

export const mockBuilderPlugins: Plugins = {
  cleanOutput: genMockPlugin('builder-plugin-clean-output'),
  startUrl: genMockPlugin('builder-plugin-start-url'),
  fileSize: genMockPlugin('builder-plugin-file-size'),
};
