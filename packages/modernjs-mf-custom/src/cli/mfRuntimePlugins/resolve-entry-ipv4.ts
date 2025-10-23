import type { ModuleFederationRuntimePlugin } from '@module-federation/enhanced/runtime';
import { LOCALHOST } from '../../constant';

declare const FEDERATION_IPV4: string | undefined;
declare const REMOTE_IP_STRATEGY: 'ipv4' | 'inherit' | undefined;

const ipv4 =
  typeof FEDERATION_IPV4 !== 'undefined' ? FEDERATION_IPV4 : '127.0.0.1';

const remoteIpStrategy =
  typeof REMOTE_IP_STRATEGY !== 'undefined' ? REMOTE_IP_STRATEGY : 'inherit';

function replaceObjectLocalhost(key: string, obj: Record<string, any>) {
  if (remoteIpStrategy !== 'ipv4') {
    return;
  }
  if (!(key in obj)) {
    return;
  }
  const remote = obj[key];
  if (remote && typeof remote === 'string' && remote.includes(LOCALHOST)) {
    obj[key] = replaceLocalhost(remote);
  }
}
function replaceLocalhost(url: string): string {
  return url.replace(LOCALHOST, ipv4);
}

const resolveEntryIpv4Plugin: () => ModuleFederationRuntimePlugin = () => ({
  name: 'resolve-entry-ipv4',

  beforeRegisterRemote(args) {
    const { remote } = args;
    replaceObjectLocalhost('entry', remote);
    return args;
  },
  async afterResolve(args) {
    const { remoteInfo } = args;
    replaceObjectLocalhost('entry', remoteInfo);
    return args;
  },
  beforeLoadRemoteSnapshot(args) {
    const { moduleInfo } = args;
    if ('entry' in moduleInfo) {
      replaceObjectLocalhost('entry', moduleInfo);
      return args;
    }
    if ('version' in moduleInfo) {
      replaceObjectLocalhost('version', moduleInfo);
    }
    return args;
  },
  loadRemoteSnapshot(args) {
    const { remoteSnapshot } = args;
    if ('publicPath' in remoteSnapshot) {
      replaceObjectLocalhost('publicPath', remoteSnapshot);
    }
    if ('getPublicPath' in remoteSnapshot) {
      replaceObjectLocalhost('getPublicPath', remoteSnapshot);
    }
    if (remoteSnapshot.remotesInfo) {
      Object.keys(remoteSnapshot.remotesInfo).forEach(key => {
        const remoteInfo = remoteSnapshot.remotesInfo[key];
        replaceObjectLocalhost('matchedVersion', remoteInfo);
      });
    }
    return args;
  },
});
export default resolveEntryIpv4Plugin;
