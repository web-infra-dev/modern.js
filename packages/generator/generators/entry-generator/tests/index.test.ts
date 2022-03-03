import path from 'path';
import os from 'os';
import { fs } from '@modern-js/generator-utils';
import {
  CodeSmith,
  FsMaterial,
  GeneratorCore,
  MaterialsManager,
} from '@modern-js/codesmith';
import { AppAPI } from '@modern-js/codesmith-api-app';
import { MWADefaultConfig } from '@modern-js/generator-common';
import generator, { handleTemplateFile } from '../src';

describe('entry-generator', () => {
  it('default', () => {
    expect(generator).toBeInstanceOf(Function);
  });
});

describe('run entry generator', () => {
  afterEach(() => {
    const projectDir = path.join(os.tmpdir(), 'modern-js-test', 'entry');
    fs.removeSync(projectDir);
  });
  const smith = new CodeSmith({});
  const projectDir = path.join(os.tmpdir(), 'modern-js-test', 'entry');
  fs.mkdirSync(projectDir);
  fs.writeJSONSync(path.join(projectDir, 'package.json'), {});
  fs.writeJSONSync(path.join(projectDir, 'tsconfig.json'), {});
  const mockGeneratorCore = new GeneratorCore({
    logger: smith.logger,
    materialsManager: new MaterialsManager(),
    outputPath: projectDir,
  });
  mockGeneratorCore.addMaterial('default', new FsMaterial(projectDir));
  mockGeneratorCore._context.config = {
    ...MWADefaultConfig,
    noNeedInstall: true,
    needModifyMWAConfig: 'yes',
    clientRoute: 'conventionalRoute',
    entriesDir: './src',
  };
  mockGeneratorCore._context.current = {
    material: new FsMaterial(path.join(__dirname, '..')),
  };
  const appApi = new AppAPI(mockGeneratorCore._context, mockGeneratorCore);

  appApi.runSubGenerator = async (
    _subGenerator: string,
    _relativePwdPath?: string,
    _config?: Record<string, unknown>,
    // eslint-disable-next-line @typescript-eslint/no-empty-function
  ) => {};
  it('run entry generator with page route', async () => {
    await handleTemplateFile(
      mockGeneratorCore._context,
      mockGeneratorCore,
      appApi,
    );
    expect(
      fs.existsSync(path.join(projectDir, 'src', 'pages', 'index.tsx')),
    ).toBe(true);
  });
});
