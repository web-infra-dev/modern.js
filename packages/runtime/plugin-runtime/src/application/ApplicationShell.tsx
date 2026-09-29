import type React from 'react';
import { useEffect } from 'react';

/** The same boundary in the server and browser component trees. */
export function ApplicationShell({
  children,
  marker,
  onCommit,
}: {
  children: React.ReactNode;
  marker: string;
  onCommit?: () => void;
}) {
  useEffect(() => {
    onCommit?.();
  }, [onCommit]);
  return (
    <>
      {children}
      <template id={marker} />
    </>
  );
}
