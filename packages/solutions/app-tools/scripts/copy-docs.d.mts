export interface BundleDocsOptions {
  /** Docs site build output to copy from (e.g. `doc_build`). */
  source: string;
  /** Directory to write the bundle to. */
  target: string;
  /** Index file shipped alongside the pages. Defaults to `llms.txt`. */
  indexFile?: string;
  /** Top-level directories to skip. Defaults to `['zh']`. */
  excludedDirs?: string[];
}

/**
 * Copies a documentation site's build output into a package, so projects get
 * version-matched offline docs for AI coding agents.
 *
 * @returns the number of files copied, or 0 when the source is absent.
 */
export function bundleDocs(options: BundleDocsOptions): number;
