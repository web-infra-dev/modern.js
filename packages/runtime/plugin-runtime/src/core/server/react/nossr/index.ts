import React, { ReactElement, useEffect, useState } from 'react';

let csr = false;
export const NoSSR = (
  props: React.PropsWithChildren<{ fallback?: ReactElement | string }>,
) => {
  const [isMounted, setMounted] = useState(csr);
  useEffect(() => {
    csr = true;
    setMounted(true);
  });

  const { children, fallback = null } = props;
  return React.createElement(
    React.Fragment,
    null,
    isMounted ? children : fallback,
  );
};
