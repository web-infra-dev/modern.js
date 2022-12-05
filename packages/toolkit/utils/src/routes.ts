import path from 'path';
import { normalizeToPosixPath } from './path';
import { MAIN_ENTRY_NAME } from './constants';

export const getPathWithoutExt = (filename: string) => {
  const extname = path.extname(filename);
  return filename.slice(0, -extname.length);
};

export const getRouteId = (
  componentPath: string,
  routesDir: string,
  entryName: string,
) => {
  const relativePath = normalizeToPosixPath(
    path.relative(routesDir, componentPath),
  );
  const pathWithoutExt = getPathWithoutExt(relativePath);
  let id = ``;
  if (entryName === MAIN_ENTRY_NAME) {
    id = pathWithoutExt;
  } else {
    id = `${entryName}_${pathWithoutExt}`;
  }
  return id;
};
