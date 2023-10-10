/**
 * Get the current NODE_ENV, or default to 'development' if not set.
 */
export const getNodeEnv = (): string => process.env.NODE_ENV || 'development';

export const isDev = (): boolean => getNodeEnv() === 'development';

export const isProd = (): boolean => getNodeEnv() === 'production';

export const isTest = () => getNodeEnv() === 'test';

export const isBrowser = (): boolean => typeof window !== 'undefined';
