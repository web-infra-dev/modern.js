import path from 'path';
import { normalizeToPosixPath } from '@modern-js/utils';

const getPathWithoutExt = (filename: string) => {
  const extname = path.extname(filename);
  return filename.slice(0, -extname.length);
};

const getRouteId = (componentPath: string, routesDir: string) => {
  const relativePath = normalizeToPosixPath(
    path.relative(routesDir, componentPath),
  );
  const id = getPathWithoutExt(relativePath);
  return id;
};

export const generateClient = ({
  basedir,
  filename,
}: {
  basedir: string;
  filename: string;
}) => {
  // TODO: loader 的约定变更
  const componentPath = path.join(path.dirname(filename), 'layout.ts');
  const routeId = getRouteId(componentPath, basedir);
  const requestCreatorPath = path
    .join(__dirname, './create-request')
    .replace('node', 'treeshaking')
    .replace(/\\/g, '/');
  const importCode = `
    import { createRequest } from '${requestCreatorPath}';
  `;
  const requestCode = `
    const loader = createRequest('${routeId}');
    export default loader;
    export { loader };
  `;

  return `
    ${importCode}
    ${requestCode}
  `;
};
