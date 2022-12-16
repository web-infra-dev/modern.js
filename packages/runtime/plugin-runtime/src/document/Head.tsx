// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React, { useContext } from 'react';
import { DocumentStructrueContext } from './DocumentStructrueContext';
import { Scripts } from './Scripts';
import { Links } from './Links';
import { DOCUMENT_META_PLACEHOLDER } from './constants';

export function Head(props: { children?: any }) {
  const { hasSetScripts, hasSetLinks } = useContext(DocumentStructrueContext);
  const { children } = props;
  // todo: verify the children
  return (
    <head>
      {/* configuration by config.output.meta */}
      {`${DOCUMENT_META_PLACEHOLDER}`}
      {!hasSetLinks && <Links />}
      {/* Scripts must have as default. If not, place in Head */}
      {!hasSetScripts && <Scripts />}
      {children}
    </head>
  );
}

export function DefaultHead() {
  return <head>{`${DOCUMENT_META_PLACEHOLDER}`}</head>;
}
