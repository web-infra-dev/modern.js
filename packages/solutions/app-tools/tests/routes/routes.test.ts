import { fs } from '@modern-js/utils';
import { generateRoutes } from '../../src/utils/routes';

describe('routes', () => {
  test('generateRoutes', async () => {
    rstest
      .spyOn(fs, 'outputFile')
      .mockImplementation((filename: string, output: string) => ({
        filename,
        output,
      }));

    const mockAppContext = {
      serverRoutes: [],
      distDirectory: './dist',
    };
    await generateRoutes(mockAppContext as any);
    expect(fs.outputFile).toHaveBeenCalledTimes(1);
  });
});
