import path from 'path';
import os from 'os';
import { fs } from '@modern-js/generator-utils';
import {
  CodeSmith,
  FsMaterial,
  GeneratorCore,
  MaterialsManager,
} from '@modern-js/codesmith';
import { MonorepoDefaultConfig } from '@modern-js/generator-common';
import { AppAPI } from '@modern-js/codesmith-api-app';
import generator, { handleTemplateFile } from '../src';

jest.setTimeout(30000);

describe('monorepo-generator', () => {
  it('default', () => {
    expect(generator).toBeInstanceOf(Function);
  });
});

describe('run monorepo-generator', () => {
  afterEach(() => {
    const projectDir = path.join(os.tmpdir(), 'modern-js-test', 'monorepo');
    fs.removeSync(projectDir);
  });
  const smith = new CodeSmith({});
  const projectDir = path.join(os.tmpdir(), 'modern-js-test', 'monorepo');
  const mockGeneratorCore = new GeneratorCore({
    logger: smith.logger,
    materialsManager: new MaterialsManager(),
    outputPath: projectDir,
  });
  mockGeneratorCore.addMaterial('default', new FsMaterial(projectDir));
  mockGeneratorCore._context.config = {
    ...MonorepoDefaultConfig,
    noNeedInstall: true,
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
  it('run monorepo generator with pnpm', async () => {
    await handleTemplateFile(
      mockGeneratorCore._context,
      mockGeneratorCore,
      appApi,
    );
    expect(fs.existsSync(path.join(projectDir, 'package.json'))).toBe(true);
    const pkg = fs.readJSONSync(path.join(projectDir, 'package.json'), 'utf-8');
    expect(pkg.devDependencies['@modern-js/monorepo-tools']).toBe('^1.2.0');
  });
  it('run monorepo generator with yarn', async () => {
    mockGeneratorCore._context.config = {
      ...MonorepoDefaultConfig,
      packageManager: 'yarn',
      noNeedInstall: true,
    };
    await handleTemplateFile(
      mockGeneratorCore._context,
      mockGeneratorCore,
      appApi,
    );
    expect(fs.existsSync(path.join(projectDir, 'package.json'))).toBe(true);
    const pkg = fs.readJSONSync(path.join(projectDir, 'package.json'), 'utf-8');
    expect(pkg.devDependencies['@modern-js/monorepo-tools']).toBe('^1.2.0');
  });
});
