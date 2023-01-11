import React from 'react';
import garfishPlugin from '../src/cli';
import '@testing-library/jest-dom';

global.React = React;

const addExportList: any[] = [];
jest.mock('@modern-js/utils', () => {
  const originalModule = jest.requireActual('@modern-js/utils');
  return {
    __esModule: true,
    ...originalModule,
    createRuntimeExportsUtils: () => ({
      addExport: (val: any) => {
        addExportList.push(val);
      },
      getPath: () => 'test',
    }),
  };
});

describe('plugin-garfish', () => {
  test('cli addRuntimeExports', async () => {
    const resolveConfig: any = {};
    const mfPackagePath = '@modern-js/test/plugin-garfish';
    const plugin = garfishPlugin({
      mfPackagePath,
    });

    const lifecycle = await plugin.setup!({
      useResolvedConfigContext: () => resolveConfig,
      useConfigContext: () => resolveConfig,
      useAppContext: () => ({
        internalDirectory: 'test',
      }),
    } as any);

    lifecycle?.config!();
    lifecycle?.addRuntimeExports!();
    expect(addExportList).toMatchSnapshot();
  });
});
