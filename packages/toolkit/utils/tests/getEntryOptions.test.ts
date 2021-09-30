import { getEntryOptions } from '@/getEntryOptions';

describe('get entry options', () => {
  test('should return default options', () => {
    expect(getEntryOptions('page-a', 'default value')).toEqual('default value');

    expect(
      getEntryOptions('page-a', 'default value', { 'page-b': 'a' }),
    ).toEqual('default value');
  });

  test(`should return options from optionsByEntries`, () => {
    expect(
      getEntryOptions('page-a', 'default value', { 'page-a': 'a' }),
    ).toEqual('a');
  });

  expect(
    getEntryOptions(
      'page-a',
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
    >('page-a', { name: 'a' }, { 'page-a': false }),
  ).toEqual(false);
});
