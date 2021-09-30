import { TestConfigOperator } from '../testConfigOperator';
import { patchMergeUserJestConfig } from './mergeUserJestConfig';
import { patchTransformer } from './transformer';
import { patchAssetsModule } from './assetsModule';

type Patch = (testConfig: TestConfigOperator) => any;

const _applyPatches = async (
  patches: Patch[],
  testOperator: TestConfigOperator,
) => {
  for (const patch of patches) {
    await patch(testOperator);
  }
};

const patches = [patchTransformer, patchMergeUserJestConfig, patchAssetsModule];

export const applyPatches = async (testConfig: TestConfigOperator) => {
  await _applyPatches(patches, testConfig);
};
