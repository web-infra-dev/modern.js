import {
  type SnapshotSerializerOptions,
  createSnapshotSerializer,
} from 'path-serializer';

export const initSnapshotSerializer = (options?: SnapshotSerializerOptions) => {
  expect.addSnapshotSerializer(createSnapshotSerializer(options));
};
