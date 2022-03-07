import '@testing-library/jest-dom';
import GarfishPlugin from '../src/cli';

jest.mock('@modern-js/core', () => {
  const originalModule = jest.requireActual('@modern-js/core');
  return {
    __esModule: true,
    ...originalModule,
    default: jest.fn(() => 'mocked baz'),
    useResolvedConfigContext: () => ({
      runtime: {
        masterApp: {},
      },
      deploy: {
        microFrontend: true,
      },
    }),
  };
});

describe('plugin-garfish cli', () => {
  test('cli garfish basename', () => {
    expect(GarfishPlugin.name).toBe('@modern-js/plugin-garfish');
    const pluginLifeCycle = GarfishPlugin.initializer();
    const basename = '/test';
    const resolveConfig = {
      resolved: {
        runtime: {
          router: {
            historyOptions: { basename }
          },
          masterApp: {}
        }
      }
    };
    expect((pluginLifeCycle as any).resolvedConfig(resolveConfig).resolved.runtime.masterApp.basename).toBe(basename);
  });
});
