import { HTML_CHUNKSMAP_SEPARATOR } from '@modern-js/utils/universal/constants';

export const DOC_EXT = ['jsx', 'tsx', 'ts', 'js'];
export const DOCUMENT_META_PLACEHOLDER = encodeURIComponent('<%= meta %>');
export const HTML_SEPARATOR = '<!--<?- html ?>-->';
export const HEAD_PARTICALS_SEPARATOR = encodeURIComponent(
  '<!--<?- partials.head ?>-->',
);
export const BODY_PARTICALS_SEPARATOR = encodeURIComponent(
  '<!--<?- partials.body ?>-->',
);
export const TOP_PARTICALS_SEPARATOR = encodeURIComponent(
  '<!--<?- partials.top ?>-->',
);

export const HTML_SSRDATASCRIPT_SEPARATOR = '<!--<?- SSRDataScript ?>-->';
// export const HTML_BOTTOMTPL_SEPARATOR = '<!--<?- bottomTemplate ?>-->'; // document jsx not need bottom

export const DOCUMENT_SSR_PLACEHOLDER = encodeURIComponent(HTML_SEPARATOR);
export const DOCUMENT_CHUNKSMAP_PLACEHOLDER = encodeURIComponent(
  HTML_CHUNKSMAP_SEPARATOR,
);
export const DOCUMENT_SSRDATASCRIPT_PLACEHOLDER = encodeURIComponent(
  HTML_SSRDATASCRIPT_SEPARATOR,
);
export const DOCUMENT_FILE_NAME = 'Document';
export const DOCUMENT_SCRIPTS_PLACEHOLDER = encodeURIComponent(
  '<!-- chunk scripts placeholder -->',
);
export const DOCUMENT_LINKS_PLACEHOLDER = encodeURIComponent(
  '<!-- chunk links placeholder -->',
);
export const DOCUMENT_SCRIPT_PLACEHOLDER_START = encodeURIComponent(
  '<!-- script-start -->',
);
export const DOCUMENT_SCRIPT_PLACEHOLDER_END = encodeURIComponent(
  '<!-- script-end -->',
);
export const DOCUMENT_STYLE_PLACEHOLDER_START = encodeURIComponent(
  '<!-- style-start -->',
);
export const DOCUMENT_STYLE_PLACEHOLDER_END =
  encodeURIComponent('<!-- style-end -->');
export const DOCUMENT_COMMENT_PLACEHOLDER_START = encodeURIComponent(
  '<!-- comment-start -->',
);
export const DOCUMENT_COMMENT_PLACEHOLDER_END = encodeURIComponent(
  '<!-- comment-end -->',
);

export const PLACEHOLDER_REPLACER_MAP = {
  [DOCUMENT_SSR_PLACEHOLDER]: HTML_SEPARATOR,
  [DOCUMENT_CHUNKSMAP_PLACEHOLDER]: HTML_CHUNKSMAP_SEPARATOR,
  [DOCUMENT_SSRDATASCRIPT_PLACEHOLDER]: HTML_SSRDATASCRIPT_SEPARATOR,
};
