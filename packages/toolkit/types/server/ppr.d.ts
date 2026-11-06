/**
 * Build output of partial prerendering (`server.ssr.mode: 'ppr'`).
 * One artifact is produced for every prerendered pathname and variant.
 */
export interface PPRArtifact {
  /** Normalized request pathname the artifact was rendered for */
  pathname: string;
  /**
   * Values of the dimensions the prelude depends on, declared by runtime
   * plugins through `ssrContext.ppr.vary`, e.g. `{ lng: 'en' }`.
   */
  variant: Record<string, string>;
  /** HTML template part before the app root, with nonce placeholders */
  head: string;
  /** Prerendered React prelude, with nonce placeholders */
  prelude: string;
  /** JSON text of React's postponed state, `null` when nothing is postponed */
  postponed: string | null;
}

export interface PPRManifest {
  version: 1;
  /** Artifacts grouped by entry name */
  entries: Record<string, PPRArtifact[]>;
}
