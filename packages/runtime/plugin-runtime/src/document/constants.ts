export const DOC_EXT = ['jsx', 'tsx', 'ts', 'js'];
export const DOCUMENT_META_PLACEHOLDER = encodeURIComponent('<%= meta %>');
export const HTML_SEPARATOR_START = '<!--<?- html-start ?>-->';
export const HTML_SEPARATOR_END = '<!--<?- html-end ?>-->';

export const HTML_CHUNKSMAP_SEPARATOR = '<!--<?- chunksMap.js ?>-->';
export const HTML_SSRDATASCRIPT_SEPARATOR = '<!--<?- SSRDataScript ?>-->';
// export const HTML_BOTTOMTPL_SEPARATOR = '<!--<?- bottomTemplate ?>-->'; // document jsx not need bottom

export const DOCUMENT_SSR_START_PLACEHOLDER =
  encodeURIComponent(HTML_SEPARATOR_START);
export const DOCUMENT_SSR_END_PLACEHOLDER =
  encodeURIComponent(HTML_SEPARATOR_END);
export const DOCUMENT_CHUNKSMAP_PLACEHOLDER = encodeURIComponent(
  HTML_CHUNKSMAP_SEPARATOR,
);
export const DOCUMENT_SSRDATASCRIPT_PLACEHOLDER = encodeURIComponent(
  HTML_SSRDATASCRIPT_SEPARATOR,
);
export const DOCUMENT_FILE_NAME = 'document';
export const DOCUMENT_SCRIPTS_PLACEHOLDER = encodeURIComponent(
  '<!-- chunk scripts placeholder -->',
);
export const DOCUMENT_NO_SCRIPTE_PLACEHOLDER =
  encodeURIComponent('<!-- no-script -->');

export const PLACEHOLDER_REPLACER_MAP = {
  [DOCUMENT_NO_SCRIPTE_PLACEHOLDER]: `We're sorry but react app doesn't work properly without JavaScript enabled. Please enable it to continue.`,
  [DOCUMENT_SSR_START_PLACEHOLDER]: HTML_SEPARATOR_START,
  [DOCUMENT_SSR_END_PLACEHOLDER]: HTML_SEPARATOR_END,
  [DOCUMENT_CHUNKSMAP_PLACEHOLDER]: HTML_CHUNKSMAP_SEPARATOR,
  [DOCUMENT_SSRDATASCRIPT_PLACEHOLDER]: HTML_SSRDATASCRIPT_SEPARATOR,
};
