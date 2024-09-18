import React from 'react';
import { type ReactElement, useEffect, useState } from 'react';

export const NoSSR = (
  props?: React.PropsWithChildren<{ fallback?: ReactElement | string }>,
): ReactElement | null => {
  const [isMounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const { children, fallback = null } = props || {};
  return React.createElement(
    React.Fragment,
    null,
    isMounted ? children : fallback,
  );
};
