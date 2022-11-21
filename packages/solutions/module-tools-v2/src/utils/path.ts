import path from 'path';

export const getCompiledPath = async (packageName: string) => {
  const { slash } = await import('@modern-js/utils');
  return slash(path.join(__dirname, '../../compiled', packageName));
};
