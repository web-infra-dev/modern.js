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
import generator, { handleTemplateFile } from '../src';

describe('dependence-generator', () => {
  it('default', () => {
    expect(generator).toBeInstanceOf(Function);
  });
});

describe('run dependence-generator', () => {
  beforeEach(() => {
    const projectDir = path.join(os.tmpdir(), 'modern-js-test', 'dependence');
    fs.ensureDirSync(projectDir);
    fs.writeJSONSync(
      path.join(projectDir, 'package.json'),
      { name: 'dependence' },
      'utf-8',
    );
    fs.writeJSONSync(path.join(projectDir, 'tsconfig.json'), {}, 'utf-8');
  });
  afterEach(() => {
    const projectDir = path.join(os.tmpdir(), 'modern-js-test', 'dependence');
    fs.removeSync(projectDir);
  });
  const smith = new CodeSmith({});
  const projectDir = path.join(os.tmpdir(), 'modern-js-test', 'dependence');
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
  it('config not has project path', async () => {
    mockGeneratorCore._context.config = {
      devDependencies: { '@modern-js/plugin-less': '^1' },
      dependencies: { '@modern-js/runtime': '^1' },
      peerDependencies: { '@modern-js/core': '^1' },
      appendTypeContent:
        "/// <reference types='@modern-js/plugin-testing/types' />",
    };
    await handleTemplateFile(mockGeneratorCore._context, mockGeneratorCore);
    expect(fs.existsSync(path.join(projectDir, 'package.json'))).toBe(true);
    const pkg = fs.readJSONSync(path.join(projectDir, 'package.json'), 'utf-8');
    expect(pkg.devDependencies['@modern-js/plugin-less']).toBe('^1');
    expect(pkg.dependencies['@modern-js/runtime']).toBe('^1');
    expect(pkg.peerDependencies['@modern-js/core']).toBe('^1');
    const typeContent = fs.readFileSync(
      path.join(projectDir, 'src', 'modern-app-env.d.ts'),
      'utf-8',
    );
    expect(typeContent).toContain(
      "/// <reference types='@modern-js/plugin-testing/types' />",
    );
  });
  it('config has project path', async () => {
    fs.ensureDirSync(path.join(projectDir, 'apps', 'mwa'));
    fs.writeJSONSync(
      path.join(projectDir, 'apps', 'mwa', 'package.json'),
      { name: 'dependence' },
      'utf-8',
    );
    fs.writeJSONSync(
      path.join(projectDir, 'apps', 'mwa', 'tsconfig.json'),
      {},
      'utf-8',
    );
    mockGeneratorCore._context.config = {
      devDependencies: { '@modern-js/plugin-less': '^1' },
      dependencies: { '@modern-js/runtime': '^1' },
      peerDependencies: { '@modern-js/core': '^1' },
      appendTypeContent:
        "/// <reference types='@modern-js/plugin-testing/types' />",
      projectPath: 'apps/mwa',
    };
    await handleTemplateFile(mockGeneratorCore._context, mockGeneratorCore);
    expect(
      fs.existsSync(path.join(projectDir, 'apps', 'mwa', 'package.json')),
    ).toBe(true);
    const pkg = fs.readJSONSync(
      path.join(projectDir, 'apps', 'mwa', 'package.json'),
      'utf-8',
    );
    expect(pkg.devDependencies['@modern-js/plugin-less']).toBe('^1');
    expect(pkg.dependencies['@modern-js/runtime']).toBe('^1');
    expect(pkg.peerDependencies['@modern-js/core']).toBe('^1');
    const typeContent = fs.readFileSync(
      path.join(projectDir, 'apps', 'mwa', 'src', 'modern-app-env.d.ts'),
      'utf-8',
    );
    expect(typeContent).toContain(
      "/// <reference types='@modern-js/plugin-testing/types' />",
    );
  });
});
