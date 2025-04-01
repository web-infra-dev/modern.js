import { renderToString } from 'react-dom/server';
import {
  DOCUMENT_SCRIPT_ATTRIBUTES_END,
  DOCUMENT_SCRIPT_ATTRIBUTES_START,
  DOCUMENT_SCRIPT_PLACEHOLDER_END,
  DOCUMENT_SCRIPT_PLACEHOLDER_START,
} from './constants';

export function Script(props: DocumentScriptProps) {
  const { content, ...rests } = props;
  const contentStr = content?.toString();
  const contentIIFE = contentStr?.length
    ? encodeURIComponent(`(${contentStr})()`)
    : '';
  const scriptProperties = renderToString(<script {...rests} />);
  const scriptpPropertiesStr = encodeURIComponent(
    scriptProperties.replace('<script ', '').replace('></script>', ''),
  );

  return (
    <>
      {`${DOCUMENT_SCRIPT_PLACEHOLDER_START}`}
      {`${DOCUMENT_SCRIPT_ATTRIBUTES_START}${scriptpPropertiesStr}${DOCUMENT_SCRIPT_ATTRIBUTES_END}`}
      {`${contentIIFE}`}
      {`${DOCUMENT_SCRIPT_PLACEHOLDER_END}`}
    </>
  );
}

// tofix: 之前错误的给了 content 作为 Script 组件的 IIFE 载体，但 content 在 htmlelement.meta 上有含义
export interface DocumentScriptProps
  extends Omit<React.ScriptHTMLAttributes<HTMLScriptElement>, 'content'> {
  content?: () => void;
}
