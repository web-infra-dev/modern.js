export const remoteFeatureFlags = ['rsc', 'mf', 'actions'] as const;

export function getRemoteMetaLabel() {
  return remoteFeatureFlags.join('|');
}

const remoteMeta = {
  kind: 'remote-meta-default',
  version: 'v1',
};

export default remoteMeta;
