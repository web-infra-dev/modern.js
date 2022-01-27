import '@testing-library/jest-dom';
import { makeProvider } from '../src/cli/utils';

describe('plugin-garfish cli', () => {
  test('makeProvider', async () => {
    const garfishExport = makeProvider('modernJSExportComponent');
    expect(garfishExport).toMatchSnapshot();
  });
});
