import { defaultDistFileExtMap } from '../src/constants';

describe('constants', () => {
  it('defaultDistFileExtMap', () => {
    expect(defaultDistFileExtMap).toStrictEqual({
      '.js': '.js',
      '.jsx': '.js',
      '.ts': '.js',
      '.tsx': '.js',
    });
  });
});
