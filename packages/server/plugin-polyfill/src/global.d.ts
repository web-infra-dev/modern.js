declare module '@modern-js/polyfill-lib' {
  export const getPolyfillString: (options: {
    uaString: string;
    minify: boolean;
    features: Record<string, { flags: string[] }>;
  }) => Promise<string>;
}
