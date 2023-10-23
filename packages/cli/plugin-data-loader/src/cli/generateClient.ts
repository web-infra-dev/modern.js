import path from 'path';

export const generateClient = ({
  inline,
  action,
  routeId,
}: {
  inline: boolean;
  action?: boolean;
  routeId: string;
}) => {
  let requestCode = ``;
  const requestCreatorPath = path
    .join(__dirname, './createRequest')
    .replace('/cjs/cli/', '/esm/cli/')
    .replace(/\\/g, '/');

  const importCode = `
    import { createRequest, createActionRequest } from '${requestCreatorPath}';
  `;

  if (inline) {
    if (action) {
      requestCode = `
      export const loader = createRequest('${routeId}');
      export const action = createActionRequest('${routeId}')
    `;
    } else {
      requestCode = `
      export const loader = createRequest('${routeId}');
    `;
    }
  } else {
    requestCode = `
    export default createRequest('${routeId}');
  `;
  }

  const generatedCode = `
    ${importCode}
    ${requestCode}
  `;

  return generatedCode;
};
