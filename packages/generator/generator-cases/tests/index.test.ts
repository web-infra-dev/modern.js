import { getMWACases, getModuleCases, getMonorepoCases } from '@/index';

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
});
