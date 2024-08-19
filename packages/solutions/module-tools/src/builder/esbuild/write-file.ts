import path from 'path';
import { fs } from '@modern-js/utils';
import convertSourceMap from 'convert-source-map';
import type { Chunk, ICompiler } from '../../types';

const SOURCE_MAPPING_URL = 'sourceMappingURL';
let preOutputChunk: Map<string, Chunk> | null = null;

function appendSourceMapURLLink(options: { filename: string; code: string }) {
  return `${options.code}\n//# ${SOURCE_MAPPING_URL}=${options.filename}.map`;
}

function appendSourceMapInline(options: { map: string; code: string }) {
  return `${options.code}\n//# ${SOURCE_MAPPING_URL}=data:application/json;charset=utf-8;base64,${options.map}`;
}

function chunkHasChanged(key: string, chunk: Chunk) {
  if (preOutputChunk) {
    const preChunk = preOutputChunk.get(key);
    if (preChunk && preChunk.contents === chunk.contents) {
      return false;
    }
  }
  return true;
}

export const writeFile = async (compiler: ICompiler) => {
  for (const [key, value] of compiler.outputChunk.entries()) {
    if (!chunkHasChanged(key, value)) {
      continue;
    }
    const absPath = path.resolve(compiler.config.outDir, key);
    await fs.ensureDir(path.dirname(absPath));
    if (value.type === 'chunk' && value.map) {
      if (
        compiler.config.sourceMap === false ||
        compiler.config.sourceMap === 'external'
      ) {
        await fs.writeFile(absPath, value.contents);
      } else if (compiler.config.sourceMap === true) {
        await fs.writeFile(
          absPath,
          appendSourceMapURLLink({
            code: value.contents,
            filename: path.basename(absPath),
          }),
        );
      } else if (compiler.config.sourceMap === 'inline') {
        await fs.writeFile(
          absPath,
          appendSourceMapInline({
            code: value.contents,
            map: convertSourceMap.fromObject(value.map).toBase64(),
          }),
        );
      }

      if (
        compiler.config.sourceMap === true ||
        compiler.config.sourceMap === 'external'
      ) {
        await fs.writeFile(`${absPath}.map`, JSON.stringify(value.map));
      }
    } else {
      await fs.writeFile(absPath, value.contents);
    }
  }
  preOutputChunk = compiler.outputChunk;
};
