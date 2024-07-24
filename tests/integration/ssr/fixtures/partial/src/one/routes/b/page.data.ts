import fs from 'fs/promises';

export const loader = () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  typeof fs;
  return 'PageB Data';
};
