import path from 'path';
import { fs } from '@modern-js/utils';
import type { ImportMap } from '../../src/Compiler';
import { transformEsmImports } from '../../src/utils/transformEsmImports';

export const transformFilesWithImportMap = async (
  files: string[],
  importMap: ImportMap,
) => {
  for (const file of files) {
    const transformed = await transformEsmImports(
      fs.readFileSync(file).toString(),
      async spec => {
        if (importMap.imports[spec]) {
          // FIXME: if run test in windows, need unslash
          return path.resolve('/dist', importMap.imports[spec]);
        }
        if (!spec.startsWith('/dist/')) {
          // eslint-disable-next-line no-console
          console.log(`${file} contains ${spec}, not exists`);
        }
        return spec;
      },
    );
    fs.writeFileSync(file, transformed);
  }
};
