import path from 'path';
import { CONFIG_CACHE_DIR, fs } from '@modern-js/utils';
import { template, checkTwinMacroExist } from '../src/utils';

describe('template utils function', () => {
  it('generate tailwindcss.config.js template', () => {
    const result = template(`${CONFIG_CACHE_DIR}/modern.config.js`);
    expect(result).toMatchSnapshot();
  });
});

describe('checkTwinMacroExist', () => {
  let originPkgContent = '';
  const projectDir = path.join(__dirname, './fixtures/twin-macro');
  const pkgPath = path.join(projectDir, 'package.json');
  const addTwinMacroToDependencies = () => {
    const content = `{"dependencies": {"twin.macro": "latest"}}`;
    fs.writeFileSync(pkgPath, content, 'utf-8');
  };
  const addTwinMacroToDevDependencies = () => {
    const content = `{"devDependencies": {"twin.macro": "latest"}}`;
    fs.writeFileSync(pkgPath, content, 'utf-8');
  };
  const addBrokenJsonContent = () => {
    const content = `{"devDependencies": {"twin.macro": "latest"}`;
    fs.writeFileSync(pkgPath, content, 'utf-8');
  };

  beforeAll(() => {
    originPkgContent = fs.readFileSync(pkgPath, 'utf-8');
  });

  it('should return `false` when not have `twin.macro` dependency in package.json`s dependencies and devDependencies', async () => {
    const result = await checkTwinMacroExist(projectDir);
    expect(result).toBe(false);
  });

  it('should return `true` when have `twin.macro` dependency in package.json`s dependencies', async () => {
    addTwinMacroToDependencies();
    const result = await checkTwinMacroExist(projectDir);
    expect(result).toBe(true);
  });

  it('should return `true` when not have `twin.macro` dependency in package.json`s devDependencies', async () => {
    addTwinMacroToDevDependencies();
    const result = await checkTwinMacroExist(projectDir);
    expect(result).toBe(true);
  });

  it('should return `false` when package.json is broken json file', async () => {
    addBrokenJsonContent();
    const result = await checkTwinMacroExist(projectDir);
    expect(result).toBe(false);
  });

  afterAll(() => {
    fs.writeFileSync(pkgPath, originPkgContent, 'utf-8');
  });
});
