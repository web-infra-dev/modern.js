if (typeof globalThis.window === 'undefined') {
  throw new Error(
    '@modern-js/devtools-kit/runtime should not be used in Node.js',
  );
}

export type * from './server';
export * from './client';
export * from './mount-point';
export * from './utils';
export * from './constants';
export * from './channel';
export type * from './rsdoctor';
