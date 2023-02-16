import path from 'path';

export const generateClient = ({
  mapFile,
  loaderId,
}: {
  mapFile: string;
  loaderId?: string;
}) => {
  delete require.cache[mapFile];
  const loadersMap: Record<
    string,
    {
      routeId: string;
      filePath: string;
      inline: boolean;
    }
  > = require(mapFile);
  let requestCode = ``;
  let exportsCode = ``;
  const requestCreatorPath = path
    .join(__dirname, './create-request')
    .replace('/cjs/cli/', '/esm/cli/')
    .replace(/\\/g, '/');

  const importCode = `
    import { createRequest } from '${requestCreatorPath}';
  `;

  if (!loaderId) {
    requestCode = Object.keys(loadersMap)
      .map(loaderId => {
        const { routeId } = loadersMap[loaderId];
        return `
      const ${loaderId} = createRequest('${routeId}');
    `;
      })
      .join('');

    exportsCode = `export {`;
    for (const loader of Object.keys(loadersMap)) {
      exportsCode += `${loader},`;
    }
    exportsCode += '}';
  } else {
    const loader = loadersMap[loaderId];
    requestCode = `
      const loader = createRequest('${loader.routeId}');
    `;

    exportsCode = `export default loader;`;
  }

  const generatedCode = `
    ${importCode}
    ${requestCode}
    ${exportsCode}
  `;

  return generatedCode;
};
