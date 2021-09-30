export type ServerPolyfill = {
  polyfill: {
    route: string;
    features: Record<string, { flags: string[] }>;
    minify: boolean;
  };
};
