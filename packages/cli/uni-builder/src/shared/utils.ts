import type { RsbuildTarget, NormalizedConfig } from '@rsbuild/core';

export const RUNTIME_CHUNK_NAME = 'builder-runtime';

export const JS_REGEX = /\.(?:js|mjs|cjs|jsx)$/;

export const TS_REGEX = /\.(?:ts|mts|cts|tsx)$/;

export function isServerTarget(target: RsbuildTarget[]) {
  return (Array.isArray(target) ? target : [target]).some(item =>
    ['node', 'service-worker'].includes(item),
  );
}

export const castArray = <T>(arr?: T | T[]): T[] => {
  if (arr === undefined) {
    return [];
  }
  return Array.isArray(arr) ? arr : [arr];
};

export const getHash = (config: NormalizedConfig) => {
  const { filenameHash } = config.output;

  if (typeof filenameHash === 'string') {
    return filenameHash ? `.[${filenameHash}]` : '';
  }
  return filenameHash ? '.[contenthash:8]' : '';
};
