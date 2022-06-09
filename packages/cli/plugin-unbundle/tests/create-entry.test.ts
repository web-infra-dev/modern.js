import { injectEnv } from '../src/create-entry';

describe('inject env', () => {
  it('should inject globalVars correctly', () => {
    expect(
      injectEnv({
        source: {
          globalVars: {
            'process.env.foo': 'foo',
          },
        },
      } as any),
    ).toMatchSnapshot();
  });
});
