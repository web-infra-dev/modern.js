import { makeLegalIdentifier } from '../src/makeLegalIdentifier';

describe('is default export function', () => {
  test('camel-cases names', () => {
    expect(makeLegalIdentifier('foo-bar')).toEqual('fooBar');
  });

  test('replaces keywords', () => {
    expect(makeLegalIdentifier('typeof')).toEqual('_typeof');
  });

  test('blacklists arguments', () => {
    expect(makeLegalIdentifier('arguments')).toEqual('_arguments');
  });

  test('empty', () => {
    expect(makeLegalIdentifier('')).toEqual('_');
  });

  test('handles input evaluated to blacklisted identifier', () => {
    expect(makeLegalIdentifier('parse-int')).toEqual('_parseInt');
  });
});
