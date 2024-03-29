import path from 'path';

export const debug = async (str: string) => {
  const { addPrefix } = await import('./common');
  addPrefix('DEBUG:', path.join(str));
};

console.log(__dirname, import.meta.url);
