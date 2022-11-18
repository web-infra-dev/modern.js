import path from 'path';

export const getCompiledPath = (packageName: string) =>
  path.join(__dirname, '../../compiled', packageName);
