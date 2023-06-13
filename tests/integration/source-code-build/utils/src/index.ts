import { toLowerCase, toUpperCase } from '@common/index';

export const strAdd = (str1: string, str2: string) => {
  return `a${toUpperCase(str1)}1${toLowerCase(str2)}`;
};
