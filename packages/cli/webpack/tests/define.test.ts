import { getCustomPublicEnv } from '../src/config/features/define';

describe('getCustomPublicEnv', () => {
  it('should match custom public env', () => {
    Object.assign(process.env, {
      APP_NAME_FOO: 'foo',
      'APP_NOR-BAR': 'bar',
      APP_NAME_BAZ: 'baz',
      'APP-NAME-CAR': 'car',
    });
    const env = getCustomPublicEnv({
      metaName: 'app-name',
    } as any);
    expect(env).toEqual(['APP_NAME_FOO', 'APP_NOR-BAR', 'APP_NAME_BAZ']);
  });
});
