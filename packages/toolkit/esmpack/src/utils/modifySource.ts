import { fs } from '@modern-js/utils';
import type { Logger } from '../Logger';

export function modifySourceBySpecifier(
  projectRoot: string,
  specifier: string,
  cb: (code: string) => string,
  logger?: Logger,
) {
  let codePath = '';
  try {
    codePath = require.resolve(specifier, {
      paths: [projectRoot],
    });
  } catch (e) {
    return;
  }
  const exists = fs.existsSync(codePath);
  if (!exists) {
    return;
  }
  try {
    const code = fs.readFileSync(codePath).toString();
    const modified = cb(code);
    fs.writeFileSync(codePath, modified);
    logger && logger.info(`modified ${codePath}`);
  } catch (e) {
    logger && logger.error(`fail to modify ${codePath}`);
  }
  return codePath;
}
