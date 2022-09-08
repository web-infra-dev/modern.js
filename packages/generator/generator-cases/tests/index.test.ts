import {
  getMWACases,
  getModuleCases,
  getMonorepoCases,
  getMWANewCases,
  getModuleNewCases,
  getMonorepoNewCases,
} from '../src';

describe('test generator cases', () => {
  test('test getMWACases', async () => {
    const mwaCases = getMWACases();
    expect(mwaCases).toMatchSnapshot();
  });
  test('test getModuleCases', async () => {
    const moduleCases = getModuleCases();
    expect(moduleCases).toMatchSnapshot();
  });
  test('test getMonorepoCases', async () => {
    const monorepoCases = getMonorepoCases();
    expect(monorepoCases).toMatchSnapshot();
  });
  test('test getMWANewCases', async () => {
    const mwaNewCases = getMWANewCases();
<<<<<<< HEAD
    expect(mwaNewCases.length).toBe(15);
=======
    expect(mwaNewCases.length).toBe(16);
>>>>>>> 4f77eb496 (feat: remove generator create project enable less and sass function (#1659))
  });
  test('test getModuleNewCases', async () => {
    const moduleNewCases = getModuleNewCases();
    expect(moduleNewCases).toMatchSnapshot();
  });
  test('test getMonorepoNewCases', async () => {
    const monorepoNewCases = getMonorepoNewCases();
    expect(monorepoNewCases).toMatchSnapshot();
  });
});
