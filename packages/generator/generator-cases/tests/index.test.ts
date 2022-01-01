import {
  getMWACases,
  getModuleCases,
  getMonorepoCases,
  getMWANewCases,
  getModuleNewCases,
  getMonorepoNewCases,
} from '../src/index';

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
    expect(mwaNewCases.length).toBe(24);
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
