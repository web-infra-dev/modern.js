import { getTscBinPath } from '../src/features/build/bundless/generator-dts/utils';

describe('generate dts', () => {
  test('should throw error when tsc bin is not exist', () => {
    expect(() => {
      getTscBinPath('/foo');
    }).toThrowError();
  });
});
