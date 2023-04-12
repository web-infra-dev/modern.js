import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getCustomMDXComponent } from '@modern-js/doc-core/theme';
import './index.scss';

export default (props: { moduleName: string }) => {
  return (
    <ReactMarkdown
      remarkPlugins={[
        [
          remarkGfm,
          {
            tablePipeAlign: false,
            tableCellPadding: false,
            singleTitle: false,
          },
        ],
      ]}
      components={getCustomMDXComponent()}
      className="w-full"
    >
      {props.moduleName}
    </ReactMarkdown>
  );
};
