import { EditLink } from 'shared/types';

export function useEditLink(editLink: EditLink, relativePagePath: string) {
  if (!editLink) {
    return null;
  }
  const { repoUrl, text, pattern } = editLink;
  const link = pattern.replace(':path', relativePagePath);

  return {
    repoUrl,
    text,
    link,
  };
}
