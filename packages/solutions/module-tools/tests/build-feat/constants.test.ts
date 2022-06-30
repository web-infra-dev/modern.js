import { unPresetWithTargetConfigs } from '../../src/features/build/constants';

describe('constants', () => {
  test('unPresetWithTargetConfigs', () => {
    expect(unPresetWithTargetConfigs).toMatchSnapshot();
  });
});
