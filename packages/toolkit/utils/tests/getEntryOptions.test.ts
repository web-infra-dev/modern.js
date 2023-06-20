import { getEntryOptions } from '../src';

describe('get entry options', () => {
  test('should return default options', () => {
    expect(getEntryOptions('page-a', false, 'default value')).toEqual(
      'default value',
    );

    expect(
      getEntryOptions('page-a', false, 'default value', { 'page-b': 'a' }),
    ).toEqual('default value');
  });

  test(`should return options from optionsByEntries`, () => {
    expect(
      getEntryOptions('page-a', false, 'default value', { 'page-a': 'a' }),
    ).toEqual('a');
  });

  test(`should compatible with main entry using packageName as key`, () => {
    expect(
      getEntryOptions(
        'main',
        true,
        'default value',
        { 'package-name': 'a' },
        'package-name',
      ),
    ).toEqual('a');
  });

  expect(
    getEntryOptions(
      'page-a',
      false,
      { name: 'a' },
      {
        'page-a': {
          name: 'page-a',
          about: 'b',
        },
      },
    ),
  ).toEqual({
    name: 'page-a',
    about: 'b',
  });

  expect(
    getEntryOptions<
      | {
          [name: string]: string;
        }
      | boolean
    >('page-a', false, { name: 'a' }, { 'page-a': false }),
  ).toEqual(false);
});
