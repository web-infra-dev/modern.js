import os from 'os';
import type { Rspack } from '@modern-js/app-tools';

export type ConfigType = Rspack.Configuration;

const localIpv4 = '127.0.0.1';

const getIpv4Interfaces = (): os.NetworkInterfaceInfo[] => {
  try {
    const interfaces = os.networkInterfaces();
    const ipv4Interfaces: os.NetworkInterfaceInfo[] = [];

    Object.values(interfaces).forEach(detail => {
      detail?.forEach(detail => {
        // 'IPv4' is in Node <= 17, from 18 it's a number 4 or 6
        const familyV4Value = typeof detail.family === 'string' ? 'IPv4' : 4;

        if (detail.family === familyV4Value && detail.address !== localIpv4) {
          ipv4Interfaces.push(detail);
        }
      });
    });
    return ipv4Interfaces;
  } catch (_err) {
    return [];
  }
};

export const getIPV4 = (): string => {
  const ipv4Interfaces = getIpv4Interfaces();
  const ipv4Interface = ipv4Interfaces[0] || { address: localIpv4 };
  return ipv4Interface.address;
};

export const isWebTarget = (target: string[] | string) => {
  const WEB_TARGET = 'web';
  if (Array.isArray(target)) {
    return target.includes(WEB_TARGET);
  } else if (typeof target === 'string') {
    return target === WEB_TARGET;
  }
  return false;
};

export const skipByTarget = (target: string[] | string) => {
  const IGNORE_TARGET = 'webworker';
  if (Array.isArray(target)) {
    return target.includes(IGNORE_TARGET);
  } else if (typeof target === 'string') {
    return target === IGNORE_TARGET;
  }
  return false;
};

export function isDev() {
  return process.env.NODE_ENV === 'development';
}
