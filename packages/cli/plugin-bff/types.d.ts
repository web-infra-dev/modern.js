declare module '@modern-js/core' {
  interface UserConfig {
    bff?: Partial<{
      prefix: string;
      requestCreator: string;
      fetcher: string;
    }>;
  }
}
