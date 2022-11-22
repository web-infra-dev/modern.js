export interface SharedExperimentsConfig {
  /**
   * Enable lazy compilation, compile dynamic imports only when they are in use.
   */
  lazyCompilation?:
    | boolean
    | {
        entires?: boolean;
        imports?: boolean;
      };
}
