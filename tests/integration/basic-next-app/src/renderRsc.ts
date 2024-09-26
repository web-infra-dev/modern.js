import { readFileSync } from 'fs';
import path from 'node:path';

export const getModuleMap = (distDir: string) => {
  const manifest = readFileSync(
    path.resolve(distDir, './react-client-manifest.json'),
    'utf8',
  );
  return JSON.parse(manifest);
};
