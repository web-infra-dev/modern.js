import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getCustomMDXComponent } from '@modern-js/doc-core/theme';
import { usePageData, useLang } from '@modern-js/doc-core/runtime';
import './API.scss';

export default (props: { moduleName: string }) => {
  const lang = useLang();
  const { page } = usePageData();
  const { moduleName } = props;
  const apiDoc =
    page.apiDocMap[moduleName] || page.apiDocMap[`${moduleName}-${lang}`];
  return (
    <ReactMarkdown
      remarkPlugins={[[remarkGfm]]}
      components={getCustomMDXComponent()}
      skipHtml={true}
    >
      {apiDoc}
    </ReactMarkdown>
  );
};
