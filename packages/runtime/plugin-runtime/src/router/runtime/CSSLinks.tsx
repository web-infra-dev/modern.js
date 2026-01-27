import React from 'react';

/**
 * Server Component that renders CSS link tags
 * These will be serialized into RSC payload and automatically handled by React on client
 * React will automatically hoist these link tags to the head
 */
export function CSSLinks({ cssFiles }: { cssFiles: string[] }) {
  if (cssFiles.length === 0) {
    return null;
  }

  return (
    <>
      {cssFiles.map(css => (
        <link key={css} href={css} rel="stylesheet" />
      ))}
    </>
  );
}
