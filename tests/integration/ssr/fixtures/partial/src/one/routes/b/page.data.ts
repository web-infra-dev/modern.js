import fs from 'fs/promises';

export const loader = () => {
  typeof fs;
  return 'PageB Data';
};
