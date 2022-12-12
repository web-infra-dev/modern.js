import path from 'path';
import { runCli, initBeforeTest } from '../helper';

const buildAction = jest.fn();
const devAction = jest.fn();

const fixtureDir = path.join(__dirname, '../fixtures/subcommand');

const mockPluginPath = path.join(fixtureDir, 'mock-plugin');

const mockPlugin = () => ({
  name: '@modern-js/plugin-test-storybook',
  setup: () => ({
    registerDev() {
      return {
        name: 'storybook',
        menuItem: {
          name: 'Storybook',
          value: 'storybook',
        },
        subCommands: ['storybook', 'story'],
        action: devAction,
      };
    },

    registerBuildPlatform() {
      return {
        platform: 'storybook',
        build: buildAction,
      };
    },
  }),
});

beforeAll(() => {
  jest.mock(mockPluginPath, mockPlugin);
  jest.setTimeout(30000);
});

initBeforeTest();

jest.setTimeout(50000);

describe('subCommand runner', () => {
  it('build success', async () => {
    const configFile = path.join(fixtureDir, './config.ts');

    const { success } = await runCli({
      argv: ['build', 'storybook'],
      configFile,
      appDirectory: fixtureDir,
      addonPlugins: {
        '@modern-js/plugin-test-storybook': {
          path: mockPluginPath,
          forced: true,
        },
      },
    });
    expect(success).toBeTruthy();
    expect(buildAction).toBeCalledWith('storybook', { isTsProject: false });
  });

  it('dev success', async () => {
    const configFile = path.join(fixtureDir, './config.ts');

    const { success } = await runCli({
      argv: ['dev', 'storybook'],
      configFile,
      appDirectory: fixtureDir,
      addonPlugins: {
        '@modern-js/plugin-test-storybook': {
          path: mockPluginPath,
          forced: true,
        },
      },
    });
    expect(success).toBeTruthy();
    expect(devAction).toBeCalledWith({}, { isTsProject: false });
  });
});
