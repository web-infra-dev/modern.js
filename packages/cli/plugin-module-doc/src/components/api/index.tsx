import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getCustomMDXComponent } from '@modern-js/doc-core/theme';

export default (props: { moduleName: string }) => {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={getCustomMDXComponent()}
    >
      {props.moduleName}
    </ReactMarkdown>
  );
};
