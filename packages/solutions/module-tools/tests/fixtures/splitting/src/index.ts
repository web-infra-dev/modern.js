export const debug = async (str: string) => {
  const { addPrefix } = await import('./common');
  addPrefix('DEBUG:', str);
};
