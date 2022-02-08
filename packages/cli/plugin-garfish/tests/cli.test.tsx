import '@testing-library/jest-dom';
import { PLUGIN_SCHEMAS } from '@modern-js/utils';
import { makeProvider } from '../src/cli/utils';
import GarfishPlugin, { initializer } from '../src/cli';

jest.mock('@modern-js/core', () => {
  const originalModule = jest.requireActual('@modern-js/core');
  return {
    __esModule: true,
    ...originalModule,
    default: jest.fn(() => 'mocked baz'),
    useResolvedConfigContext: () => ({
      runtime: {
        masterApp: {
          manifest: {
            componentKey: 'test-dynamic-key',
          },
        },
      },
      deploy: {
        microFrontend: 'dynamicComponentKey',
      },
    }),
  };
});

describe('plugin-garfish cli', () => {
  test('makeProvider', async () => {
    const garfishExport = makeProvider('modernJSExportComponent');
    expect(garfishExport).toMatchSnapshot();
  });

  test('test modifyEntryExport', () => {
    const lifeCycle: any = initializer({
      validateSchema() {
        return PLUGIN_SCHEMAS['@modern-js/plugin-garfish'];
      },
      externals: { 'react-dom': 'react-dom', react: 'react' },
      componentKey: 'test-dynamic-key',
    })();
    const { exportStatement } = lifeCycle.modifyEntryExport({
      entrypoint: 'hello',
      exportStatement: '',
    });
    expect(exportStatement).toMatchSnapshot();
  });

  test('cli garfish plugin', () => {
    expect(GarfishPlugin.name).toBe('@modern-js/plugin-garfish');
  });
});
