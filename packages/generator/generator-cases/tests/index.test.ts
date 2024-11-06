import { getMWACases, getMWANewCases } from '../src';

describe('test generator cases', () => {
  test('test getMWACases', async () => {
    const mwaCases = getMWACases();
    expect(mwaCases).toMatchSnapshot();
  });
  test('test getMWANewCases', async () => {
    const mwaNewCases = getMWANewCases();
    expect(mwaNewCases.length).toBe(11);
  });
});
