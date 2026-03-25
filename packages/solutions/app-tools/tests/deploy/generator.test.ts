import path from 'node:path';
import * as deployUtils from '../../src/plugins/deploy/utils' with {
  rstest: 'importActual',
};
import { serverAppContextTemplate } from '../../src/plugins/deploy/utils/generator';

rstest.mock('../../src/plugins/deploy/utils', () => ({
  __esModule: true,
  ...deployUtils,
  normalizePath: (filePath: string) => filePath,
}));

describe('deploy generator', () => {
  it('should escape backslash in generated path literal', () => {
    rstest
      .spyOn(path, 'relative')
      .mockReturnValueOnce('shared')
      .mockReturnValueOnce('api')
      .mockReturnValueOnce('api\\lambda');

    const appContext = {
      appDirectory: 'C:\\project',
      sharedDirectory: 'C:\\project\\shared',
      apiDirectory: 'C:\\project\\api',
      lambdaDirectory: 'C:\\project\\api\\lambda',
      metaName: 'modern-js',
      bffRuntimeFramework: 'hono',
    } as any;

    const context = serverAppContextTemplate(appContext);

    expect(context.sharedDirectory).toBe('path.join(__dirname, "shared")');
    expect(context.apiDirectory).toBe('path.join(__dirname, "api")');
    expect(context.lambdaDirectory).toBe(
      'path.join(__dirname, "api\\\\lambda")',
    );
  });
});
