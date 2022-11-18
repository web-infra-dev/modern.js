import { join } from 'path';

export const getCompiledPath = (packageName: string) =>
  join(__dirname, '../../compiled', packageName);
