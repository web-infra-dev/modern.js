// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React, { useContext } from 'react';
import { DocumentStructureContext } from './DocumentStructureContext';
import { Scripts } from './Scripts';
import { Links } from './Links';
import { Title } from './Title';
import {
  DOCUMENT_META_PLACEHOLDER,
  HEAD_PARTICALS_SEPARATOR,
  TOP_PARTICALS_SEPARATOR,
} from './constants';

export function Head(props: { children?: any }) {
  const { hasSetScripts, hasSetLinks, hasSetTitle } = useContext(
    DocumentStructureContext,
  );
  const { children, ...rest } = props;
  // todo: verify the children
  return (
    <head {...rest}>
      {/* configuration by config.output.meta */}
      {TOP_PARTICALS_SEPARATOR}
      {DOCUMENT_META_PLACEHOLDER}
      {!hasSetTitle && <Title />}
      {!hasSetLinks && <Links />}
      {/* Scripts must have as default. If not, place in Head */}
      {!hasSetScripts && <Scripts />}
      {HEAD_PARTICALS_SEPARATOR}
      {children}
    </head>
  );
}

export function DefaultHead() {
  return <head>{DOCUMENT_META_PLACEHOLDER}</head>;
}
