import { type ReactElement, useEffect, useState } from 'react';

export const NoSSR = (
  props: React.PropsWithChildren<{ fallback?: ReactElement | string }>,
) => {
  const [isMounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const { children, fallback = null } = props;
  return isMounted ? children : fallback;
};
