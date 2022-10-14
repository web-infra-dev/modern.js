import path from 'path';
import os from 'os';
import { fs } from '@modern-js/utils';
import { AppAPI } from '@modern-js/codesmith-api-app';
import {
  CodeSmith,
  FsMaterial,
  GeneratorCore,
  MaterialsManager,
} from '@modern-js/codesmith';
import { getPackageManagerSchema } from '../src/common/package-manager';

describe('test package manager schema', () => {
  it('get input', async () => {
    const projectDir = path.join(os.tmpdir(), 'modern-js-test', 'common');
    fs.removeSync(projectDir);
    const smith = new CodeSmith({});
    const mockGeneratorCore = new GeneratorCore({
      logger: smith.logger,
      materialsManager: new MaterialsManager(),
      outputPath: projectDir,
    });
    mockGeneratorCore.addMaterial('default', new FsMaterial(projectDir));
    mockGeneratorCore._context.current = {
      material: new FsMaterial(path.join(__dirname, '..')),
    };
    const appApi = new AppAPI(mockGeneratorCore._context, mockGeneratorCore);
    const ans = await appApi.getInputBySchemaFunc(
      () => ({
        type: 'object',
        properties: {
          packageManager: getPackageManagerSchema({
            packageManager: 'pnpm',
            isMonorepo: true,
          }),
        },
      }),
      {
        packageManager: 'pnpm',
        isMonorepo: true,
      },
    );
    expect(ans).toEqual({ packageManager: 'pnpm', isMonorepo: true });
  });
});
