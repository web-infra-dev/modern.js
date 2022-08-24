// See https://github.com/reactwg/react-18/discussions/5#discussioncomment-2276079
import React, { useRef, useLayoutEffect } from 'react';

export const WithCallback: React.FC<{
  callback: () => void;
  children: React.ReactElement;
}> = ({ callback, children }) => {
  const once = useRef(false);
  useLayoutEffect(() => {
    if (once.current) {
      return;
    }
    once.current = true;
    callback();
  }, [callback]);

  return children;
};
