export const isDev = (): boolean => process.env.NODE_ENV === 'development';

export const isProd = (): boolean => process.env.NODE_ENV === 'production';

export const isTest = () => process.env.NODE_ENV === 'test';
