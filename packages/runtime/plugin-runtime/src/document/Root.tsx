// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React, { useContext } from 'react';
import { DocumentContext } from './DocumentContext';

export function Root(props: { children?: any; rootId?: string }) {
  const { rootId, children } = props;
  const {
    templateParams: { mountId = 'root' },
  } = useContext(DocumentContext);

  return <div id={`${rootId || mountId}`}>{children}</div>;
}

export function DefaultRoot(props: { children?: any }) {
  const {
    templateParams: { mountId },
  } = useContext(DocumentContext);
  return <div id={`${mountId}`}>{props.children}</div>;
}
