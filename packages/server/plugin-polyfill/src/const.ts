export const defaultPolyfill = '/__polyfill__';

export const defaultFeatures: Record<string, { flags: string[] }> = {
  es6: { flags: ['gated'] },
};
