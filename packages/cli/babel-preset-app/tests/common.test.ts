import { genCommon } from '../src/common';

jest.mock('../src/utils', () => ({
  __esModule: true,
  isBeyondReact17: jest.fn(() => true),
}));

describe('test common', () => {
  it('base usage', () => {
    const commonConfig = genCommon({ appDirectory: 'project' });
    expect(commonConfig).not.toBeNull();
  });
});
