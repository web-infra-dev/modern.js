import path from 'path';

export const generateClient = ({ mapFile }: { mapFile: string }) => {
  const loadersMap: Record<string, string> = require(mapFile);
  const requestCode = Object.keys(loadersMap)
    .map(loaderId => {
      const routeId = loadersMap[loaderId];
      return `
      const ${loaderId} = createRequest('${routeId}');
    `;
    })
    .join('');

  let exportsCode = `export {`;
  for (const loader of Object.keys(loadersMap)) {
    exportsCode += `${loader},`;
  }
  exportsCode += '}';

  const requestCreatorPath = path
    .join(__dirname, './create-request')
    .replace('/node/cli/', '/treeshaking/cli/')
    .replace(/\\/g, '/');

  const importCode = `
    import { createRequest } from '${requestCreatorPath}';
  `;

  return `
    ${importCode}
    ${requestCode}
    ${exportsCode}
  `;
};
