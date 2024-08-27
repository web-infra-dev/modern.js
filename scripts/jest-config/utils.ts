import {
  type SnapshotSerializerOptions,
  createSnapshotSerializer,
} from '../vitest-config/src/utils';

export const initSnapshotSerializer = (options?: SnapshotSerializerOptions) => {
  expect.addSnapshotSerializer(createSnapshotSerializer(options));
};
