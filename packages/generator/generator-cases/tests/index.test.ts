import {
  getMWACases,
  getModuleCases,
  getMonorepoCases,
  getMWANewCases,
  getModuleNewCases,
  getMonorepoNewCases,
} from '@/index';

describe('test generator cases', () => {
  test('test getMWACases', async () => {
    const mwaCases = await getMWACases();
    expect(mwaCases).toMatchSnapshot();
  });
  test('test getModuleCases', async () => {
    const moduleCases = await getModuleCases();
    expect(moduleCases).toMatchSnapshot();
  });
  test('test getMonorepoCases', async () => {
    const monorepoCases = await getMonorepoCases();
    expect(monorepoCases).toMatchSnapshot();
  });
  test('test getMWANewCases', async () => {
    const mwaNewCases = await getMWANewCases();
    expect(mwaNewCases.length).toBe(22);
  });
  test('test getModuleNewCases', async () => {
    const moduleNewCases = await getModuleNewCases();
    expect(moduleNewCases).toMatchSnapshot();
  });
  test('test getMonorepoNewCases', async () => {
    const monorepoNewCases = await getMonorepoNewCases();
    expect(monorepoNewCases).toMatchSnapshot();
  });
});
