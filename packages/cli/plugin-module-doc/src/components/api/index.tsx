import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default (props: { moduleName: string }) => {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]}>
      {props.moduleName}
    </ReactMarkdown>
  );
};
