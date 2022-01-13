import { getCacheIdentifier } from '../src/getCacheIdentifier';

describe('get cache identifier', () => {
  test('should use package name and version', () => {
    expect(
      getCacheIdentifier([
        {
          name: 'package-a',
          version: '0.1.0',
        },
        {
          name: 'package-b',
          version: '1.0.1',
        },
      ]),
    ).toEqual(`test:package-a@0.1.0:package-b@1.0.1`);
  });

  test(`should return identifier with node environment`, () => {
    const packages = [
      {
        name: 'a',
        version: '0.1.0',
      },
    ];

    process.env.NODE_ENV = 'development';
    expect(getCacheIdentifier(packages)).toEqual('development:a@0.1.0');

    process.env.NODE_ENV = 'production';
    expect(getCacheIdentifier(packages)).toEqual('production:a@0.1.0');

    process.env.NODE_ENV = '';

    expect(getCacheIdentifier(packages)).toEqual(`:a@0.1.0`);
  });
});
