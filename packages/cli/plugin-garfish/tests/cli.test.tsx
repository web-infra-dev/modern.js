import '@testing-library/jest-dom';
import GarfishPlugin from '../src/cli';

// jest.mock('@modern-js/core', () => {
//   const originalModule = jest.requireActual('@modern-js/core');
//   return {
//     __esModule: true,
//     ...originalModule,
//     default: jest.fn(() => 'mocked baz'),
//     useResolvedConfigContext: () => ({
//       runtime: {
//         masterApp: {
//           manifest: {
//             componentKey: 'test-dynamic-key',
//           },
//         },
//       },
//       deploy: {
//         microFrontend: 'dynamicComponentKey',
//       },
//     }),
//   };
// });

describe('plugin-garfish cli', () => {
  test('cli garfish plugin', () => {
    expect(GarfishPlugin.name).toBe('@modern-js/plugin-garfish');
    expect(GarfishPlugin.name).toBe('@modern-js/plugin-garfish');
  });
});
