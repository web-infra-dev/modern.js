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

jest.mock('@modern-js/generator-utils', () => {
  const originalModule = jest.requireActual('@modern-js/generator-utils');
  return {
    __esModule: true,
    ...originalModule,
    getPackageVersion: jest.fn(() => '^1.0.0'),
  };
});

describe('bff-generator', () => {
  it('default', () => {
    expect(generator).toBeInstanceOf(Function);
  });
});

describe('run bff generator', () => {
  beforeEach(() => {
    const projectDir = path.join(os.tmpdir(), 'modern-js-test', 'mwa-bff');
    fs.ensureDirSync(projectDir);
    fs.writeJSONSync(
      path.join(projectDir, 'package.json'),
      { name: 'mwa-bff' },
      'utf-8',
    );
  });
  afterEach(() => {
    const projectDir = path.join(os.tmpdir(), 'modern-js-test', 'mwa-bff');
    fs.removeSync(projectDir);
  });
  const smith = new CodeSmith({});
  const projectDir = path.join(os.tmpdir(), 'modern-js-test', 'mwa-bff');
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

  appApi.runSubGenerator = async (
    _subGenerator: string,
    _relativePwdPath?: string,
    _config?: Record<string, unknown>,
    // eslint-disable-next-line @typescript-eslint/no-empty-function
  ) => {};
  it('new nest function bff', async () => {
    fs.writeJSONSync(path.join(projectDir, 'tsconfig.json'), {}, 'utf-8');
    mockGeneratorCore._context.config = {
      bffType: 'func',
      framework: 'nest',
      noNeedInstall: true,
    };
    await handleTemplateFile(
      mockGeneratorCore._context,
      mockGeneratorCore,
      appApi,
    );
    expect(fs.existsSync(path.join(projectDir, 'package.json'))).toBe(true);
    const pkg = fs.readJSONSync(path.join(projectDir, 'package.json'), 'utf-8');
    expect(typeof pkg.dependencies['@modern-js/plugin-bff']).toBe('string');
    expect(typeof pkg.dependencies['@modern-js/plugin-nest']).toBe('string');
    expect(typeof pkg.dependencies['@nestjs/core']).toBe('string');
    expect(typeof pkg.dependencies['@nestjs/common']).toBe('string');
    expect(typeof pkg.devDependencies['@types/express']).toBe('string');
  });
  it('new nest function bff in js project', async () => {
    mockGeneratorCore._context.config = {
      bffType: 'func',
      framework: 'nest',
      noNeedInstall: true,
    };
    try {
      await handleTemplateFile(
        mockGeneratorCore._context,
        mockGeneratorCore,
        appApi,
      );
    } catch (e: any) {
      expect(e.message).toBe('nest not support js project');
    }
  });
  it('new bff when api dir already exist', async () => {
    fs.ensureDirSync(path.join(projectDir, 'api'));
    fs.writeFileSync(path.join(projectDir, 'api', 'index.ts'), '', 'utf-8');
    mockGeneratorCore._context.config = {
      bffType: 'func',
      framework: 'nest',
      noNeedInstall: true,
    };
    try {
      await handleTemplateFile(
        mockGeneratorCore._context,
        mockGeneratorCore,
        appApi,
      );
    } catch (e: any) {
      expect(e.message).toBe("'api' is already exist");
    }
  });
});
