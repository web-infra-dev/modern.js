import type { ModuleFederationRuntimePlugin } from '@module-federation/modern-js-v3';

const getRemotePublicPath = (entry: string) => {
  try {
    return `${new URL(entry).origin}/`;
  } catch {
    return undefined;
  }
};

const forceRemotePublicPath = (): ModuleFederationRuntimePlugin => ({
  name: 'rsc-mf-force-remote-public-path',
  loadRemoteSnapshot(args: any) {
    const { remoteInfo, remoteSnapshot } = args;
    if (remoteInfo?.alias !== 'rscRemote' || !remoteSnapshot) {
      return args;
    }

    const entry = remoteInfo?.entry;
    if (!entry || typeof entry !== 'string') {
      return args;
    }
    const remotePublicPath = getRemotePublicPath(entry);
    if (!remotePublicPath) {
      return args;
    }

    if ('publicPath' in remoteSnapshot) {
      remoteSnapshot.publicPath = remotePublicPath;
    }
    if (remoteSnapshot.metaData && 'publicPath' in remoteSnapshot.metaData) {
      remoteSnapshot.metaData.publicPath = remotePublicPath;
    }
    if (remoteSnapshot.metaData && 'ssrPublicPath' in remoteSnapshot.metaData) {
      remoteSnapshot.metaData.ssrPublicPath = `${remotePublicPath}bundles/`;
    }

    return args;
  },
});

export default forceRemotePublicPath;
