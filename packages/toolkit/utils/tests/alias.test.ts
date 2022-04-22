import fs from 'fs';
import { validAlias, getUserAlias } from '../src/alias';

describe('validAlias', () => {
  it('should return null if no alias config', () => {
    expect(validAlias({ source: {} } as any, { tsconfigPath: '' })).toEqual(
      null,
    );
  });

  it('should return null if it is not a ts project', () => {
    const mockExistsSync = jest
      .spyOn(fs, 'existsSync')
      .mockImplementation(() => false);

    expect(
      validAlias({ source: { alias: {} } } as any, { tsconfigPath: '' }),
    ).toEqual(null);

    mockExistsSync.mockRestore();
  });

  it('should return message if it is a ts project', () => {
    const mockExistsSync = jest
      .spyOn(fs, 'existsSync')
      .mockImplementation(() => true);

    expect(
      validAlias({ source: { alias: { foo: ['bar'] } } } as any, {
        tsconfigPath: '',
      }),
    ).toBeTruthy();

    mockExistsSync.mockRestore();
  });

  it('should return null if it is a ts project and alias is empty', () => {
    const mockExistsSync = jest
      .spyOn(fs, 'existsSync')
      .mockImplementation(() => true);

    expect(
      validAlias({ source: { alias: {} } } as any, {
        tsconfigPath: '',
      }),
    ).toEqual(null);

    mockExistsSync.mockRestore();
  });
});

describe('getUserAlias', () => {
  it('should filter invalid ts paths that are not array', () => {
    expect(
      getUserAlias({
        foo: ['a', 'b'],
        bar: 'c',
      }),
    ).toEqual({
      foo: ['a', 'b'],
    });
  });
});
