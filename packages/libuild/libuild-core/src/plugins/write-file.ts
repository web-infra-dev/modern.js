import fsExtra from 'fs-extra';
import path from 'path';
import convertSourceMap from 'convert-source-map';
import { Chunk, LibuildPlugin } from '../types';

const SOURCE_MAPPING_URL = 'sourceMappingURL';

function appendSourceMapURLLink(options: { filename: string; code: string }) {
  return `${options.code}\n//# ${SOURCE_MAPPING_URL}=${options.filename}.map`;
}

function appendSourceMapInline(options: { map: string; code: string }) {
  return `${options.code}\n//# ${SOURCE_MAPPING_URL}=data:application/json;charset=utf-8;base64,${options.map}`;
}

export const writeFilePlugin = (): LibuildPlugin => {
  const pluignName = 'libuild:emit';
  return {
    name: pluignName,
    apply(compiler) {
      let preOutputChunk: Map<string, Chunk> | null = null;

      function chunkHasChanged(key: string, chunk: Chunk) {
        if (preOutputChunk) {
          const preChunk = preOutputChunk.get(key);
          if (preChunk && preChunk.contents === chunk.contents) {
            return false;
          }
        }
        return true;
      }

      compiler.hooks.endCompilation.tapPromise(pluignName, async () => {
        for (const [key, value] of compiler.outputChunk.entries()) {
          if (!chunkHasChanged(key, value)) {
            continue;
          }
          const absPath = path.resolve(compiler.config.outdir, key);
          fsExtra.ensureDirSync(path.dirname(absPath));
          if (value.type === 'chunk' && value.map) {
            if (compiler.config.sourceMap === false || compiler.config.sourceMap === 'external') {
              await fsExtra.writeFile(absPath, value.contents);
            } else if (compiler.config.sourceMap === true) {
              await fsExtra.writeFile(
                absPath,
                appendSourceMapURLLink({
                  code: value.contents,
                  filename: path.basename(absPath),
                })
              );
            } else if (compiler.config.sourceMap === 'inline') {
              await fsExtra.writeFile(
                absPath,
                appendSourceMapInline({
                  code: value.contents,
                  map: convertSourceMap.fromObject(value.map).toBase64(),
                })
              );
            }

            if (compiler.config.sourceMap === true || compiler.config.sourceMap === 'external') {
              await fsExtra.writeFile(`${absPath}.map`, JSON.stringify(value.map));
            }
          } else {
            await fsExtra.writeFile(absPath, value.contents);
          }
        }
        preOutputChunk = compiler.outputChunk;
      });
    },
  };
};
