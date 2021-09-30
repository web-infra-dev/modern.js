export const isDev = (): boolean => process.env.NODE_ENV === 'development';

export const isProd = (): boolean => process.env.NODE_ENV === 'production';

export const isTest = () => process.env.NODE_ENV === 'test';

// Variable used for enabling profiling in Production.
export const isProdProfile = () =>
  isProd() && process.argv.includes('--profile');
