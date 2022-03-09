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
import generator, { handleTemplateFile } from '../src';

describe('tailwindcss-generator', () => {
  it('default', () => {
    expect(generator).toBeInstanceOf(Function);
  });
});

describe('run tailwindcss-generator', () => {
  afterEach(() => {
    const projectDir = path.join(os.tmpdir(), 'modern-js-test', 'tailwindcss');
    fs.removeSync(projectDir);
  });
  const smith = new CodeSmith({});
  const projectDir = path.join(os.tmpdir(), 'modern-js-test', 'tailwindcss');
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

  it('run tailwindcss generator with dependencies', async () => {
    mockGeneratorCore._context.config = {
      dependencies: {
        tailwindcss: '^3',
      },
    };
    appApi.runSubGenerator = async (
      _subGenerator: string,
      _relativePwdPath?: string,
      config?: Record<string, unknown>,
    ) => {
      expect((config || {}).dependencies).toEqual({
        tailwindcss: '^2.2.19',
      });
    };
    await handleTemplateFile(
      mockGeneratorCore._context,
      mockGeneratorCore,
      appApi,
    );
  });
  it('run tailwindcss generator with devDependencies and peerDependencies', async () => {
    mockGeneratorCore._context.config = {
      devDependencies: {
        tailwindcss: '^3',
      },
      peerDependencies: {
        tailwindcss: '^3',
      },
    };
    appApi.runSubGenerator = async (
      _subGenerator: string,
      _relativePwdPath?: string,
      config?: Record<string, unknown>,
    ) => {
      expect((config || {}).devDependencies).toEqual({
        tailwindcss: '^2.2.19',
      });
      expect((config || {}).peerDependencies).toEqual({
        tailwindcss: '^2.2.19',
      });
    };
    await handleTemplateFile(
      mockGeneratorCore._context,
      mockGeneratorCore,
      appApi,
    );
  });
});
