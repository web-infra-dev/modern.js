import { useEffect, useState } from 'react';

export function NoSSR(props: { children: React.ReactNode }) {
  const { children } = props;
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  } else {
    return <>{children}</>;
  }
}
