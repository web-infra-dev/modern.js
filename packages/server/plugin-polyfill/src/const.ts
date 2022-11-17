export const defaultPolyfill = '/__polyfill__';

export const getDefaultFeatures = (): Record<string, { flags: string[] }> => ({
  es6: { flags: ['gated'] },
});
