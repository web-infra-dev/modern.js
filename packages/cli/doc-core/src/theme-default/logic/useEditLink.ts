import { EditLink } from 'shared/types';
import { usePageData } from '@/runtime';

export function useEditLink(editLink?: EditLink) {
  const pageData = usePageData();

  if (!editLink) {
    return null;
  }
  const { docRepoBaseUrl, text } = editLink;
  const relativePagePath = pageData.page._relativePath.replace(/\\/g, '/');

  return {
    docRepoBaseUrl,
    text,
    relativePagePath,
  };
}
