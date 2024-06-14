import {
  getMWACases,
  getModuleCases,
  getMWANewCases,
  getModuleNewCases,
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
  test('test getMWANewCases', async () => {
    const mwaNewCases = getMWANewCases();
    expect(mwaNewCases.length).toBe(11);
  });
  test('test getModuleNewCases', async () => {
    const moduleNewCases = getModuleNewCases();
    expect(moduleNewCases).toMatchSnapshot();
  });
});
