import type React from 'react';
import { JSX_SHELL_STREAM_END_MARK } from '../../common';

/** Preserve the server shell marker's sibling slot during client hydration. */
export function StreamRoot({
  children,
  includeMarker = false,
}: {
  children: React.ReactNode;
  includeMarker?: boolean;
}) {
  return (
    <>
      {children}
      {includeMarker ? JSX_SHELL_STREAM_END_MARK : null}
    </>
  );
}
