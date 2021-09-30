export const removeLeadingSlash = (s: string): string => s.replace(/^\/+/, '');

export const removeTailSlash = (s: string): string => s.replace(/\/+$/, '');

export const removeSlash = (s: string): string =>
  removeLeadingSlash(removeTailSlash(s));
