import path from 'node:path';
import os from 'os';
import type { Rspack } from '@rsbuild/core';

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

export const isWebTarget = (target: unknown) => {
  const WEB_TARGET = 'web';
  if (Array.isArray(target)) {
    return target.includes(WEB_TARGET);
  } else if (typeof target === 'string') {
    return target === WEB_TARGET;
  }
  return false;
};

export const skipByTarget = (target: unknown) => {
  const IGNORE_TARGET = 'webworker';
  if (Array.isArray(target)) {
    return target.includes(IGNORE_TARGET) || target.includes('web-worker');
  } else if (typeof target === 'string') {
    return target === IGNORE_TARGET || target === 'web-worker';
  }
  return false;
};

export function isDev() {
  return process.env.NODE_ENV === 'development';
}

// Node ESM and CJS artifacts have different extensions. Resolve relative to
// this package rather than the application's dependency tree.
export function resolveInternalPlugin(relativePath: string): string {
  const extension = process.env.MODERN_LIB_FORMAT === 'esm' ? '.mjs' : '.js';
  return require.resolve(path.resolve(__dirname, relativePath + extension));
}
