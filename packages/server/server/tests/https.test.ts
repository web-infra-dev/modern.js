import { genHttpsOptions } from '../src/dev-tools/https';

describe('test dev tools', () => {
  test('should get http cert correctly', async () => {
    // Todo Interaction in CI
    // const options = await genHttpsOptions(true);
    // expect(options.key).toBeDefined();
    // expect(options.cert).toBeDefined();

    const useOpt = await genHttpsOptions({
      key: 'foo',
      cert: 'baz',
    });
    expect(useOpt.key).toBe('foo');
    expect(useOpt.cert).toBe('baz');
  });
});
