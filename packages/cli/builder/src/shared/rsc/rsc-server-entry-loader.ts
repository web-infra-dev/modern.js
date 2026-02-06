import type { Rspack } from '@rsbuild/core';

/**
 * Loader to add 'use server-entry'; directive at the top of route components
 */
export default function rscServerEntryLoader(
  this: Rspack.LoaderContext,
  source: string,
) {
  this.cacheable(true);

  // Check if 'use server-entry' already exists
  const hasServerEntryDirective =
    source.includes("'use server-entry'") ||
    source.includes('"use server-entry"') ||
    source.includes('`use server-entry`');

  if (hasServerEntryDirective) {
    return source;
  }

  // Add 'use server-entry'; at the top of the file
  return `'use server-entry';\n${source}`;
}
