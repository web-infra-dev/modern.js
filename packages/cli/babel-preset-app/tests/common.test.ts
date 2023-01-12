import { genCommon } from '../src/common';

describe('test common', () => {
  it('base usage', () => {
    const commonConfig = genCommon({ appDirectory: 'project' });
    expect(commonConfig).not.toBeNull();
  });
});
