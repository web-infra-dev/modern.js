import { useContext } from 'react';
import { DocumentStructrueContext } from './DocumentStructrueContext';
import { Scripts } from './Scripts';

const DOCUMENT_META_PLACEHOLDER = encodeURIComponent('<%= meta %>');

export function Head(props: { children?: any }) {
  const { hasSetScripts } = useContext(DocumentStructrueContext);
  const { children } = props;
  // todo: 校验 children 的合法性
  return (
    <head>
      {/* 由 config.output.meta 配置的信息 */}
      {`${DOCUMENT_META_PLACEHOLDER}`}
      {/* scripts 为默认必须有的。如果没有指定，则默认在 head 中 */}
      {!hasSetScripts && <Scripts />}
      {children}
    </head>
  );
}

export function DefaultHead() {
  return <head>{`${DOCUMENT_META_PLACEHOLDER}`}</head>;
}
