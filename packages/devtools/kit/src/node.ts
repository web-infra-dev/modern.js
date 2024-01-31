if (typeof globalThis.process === 'undefined') {
  throw new Error('@modern-js/devtools-kit/node should not be used in browser');
}

export * from './server';
export * from './client';
export * from './mount-point';
export * from './utils';
export * from './constants';
export * from './channel';
export * from './rsdoctor';
