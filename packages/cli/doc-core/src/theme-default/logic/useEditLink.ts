import { usePageData } from '@/runtime';

interface EditLink {
  docRepoBaseUrl?: string;
  text?: string;
}

export function useEditLink() {
  const pageData = usePageData();

  const editLink: EditLink = pageData.siteData.themeConfig?.editLink ?? {};

  if (!editLink.docRepoBaseUrl || !editLink.text) {
    return null;
  }

  let { docRepoBaseUrl } = editLink;

  if (!docRepoBaseUrl.endsWith('/')) {
    docRepoBaseUrl += '/';
  }

  const relativePagePath = pageData.page._relativePath.replace(/\\/g, '/');
  const link = `${docRepoBaseUrl}${relativePagePath}`;

  return {
    text: editLink.text,
    link,
  };
}
