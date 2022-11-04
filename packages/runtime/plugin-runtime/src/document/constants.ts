export const DOCUMENT_META_PLACEHOLDER = encodeURIComponent('<%= meta %>');
export const DOCUMENT_FILE_NAME = 'document';
export const DOCUMENT_SCRIPTS_PLACEHOLDER = encodeURIComponent(
  '<!-- chunk scripts placeholder -->',
);
export const DOCUMENT_NO_SCRIPTE_PLACEHOLDER =
  encodeURIComponent('<!-- no-script -->');

export const PLACEHOLDER_REPLACER_MAP = {
  [DOCUMENT_NO_SCRIPTE_PLACEHOLDER]: `We're sorry but react app doesn't work properly without JavaScript enabled. Please enable it to continue.`,
};
