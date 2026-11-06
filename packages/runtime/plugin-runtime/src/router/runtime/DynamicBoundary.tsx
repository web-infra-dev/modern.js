import type React from 'react';

/**
 * Used in the client bundle. It keeps the same Suspense boundaries as the
 * server render of a partially prerendered page, so hydration matches.
 */
const DynamicBoundary = ({ children }: { children?: React.ReactNode }) => {
  return <>{children}</>;
};

export default DynamicBoundary;
