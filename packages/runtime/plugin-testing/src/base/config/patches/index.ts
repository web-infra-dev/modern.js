import type { TestConfigOperator } from '../testConfigOperator';
import { patchAssetsModule } from './assetsModule';
import { patchTransformer } from './transformer';

type Patch = (testConfig: TestConfigOperator) => any;

const _applyPatches = async (
  patches: Patch[],
  testOperator: TestConfigOperator,
) => {
  for (const patch of patches) {
    await patch(testOperator);
  }
};

const patches = [patchTransformer, patchAssetsModule];

export const applyPatches = async (testConfig: TestConfigOperator) => {
  await _applyPatches(patches, testConfig);
};
