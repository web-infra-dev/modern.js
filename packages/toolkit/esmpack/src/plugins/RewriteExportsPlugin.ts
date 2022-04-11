import path from 'path';
import { fs } from '@modern-js/utils';
import type { EsmpackPlugin } from '../Options';
import type { Compiler } from '../Compiler';
import { rewriteExports } from '../utils/rewriteExports';

const pluginName = 'RewriteExportsPlugin';

class RewriteExportsPlugin implements EsmpackPlugin {
  apply(compiler: Compiler) {
    compiler.hooks.afterCompile.tapPromise(pluginName, async compilation => {
      const output = compilation.rollupOutput?.output;
      const destLoc = compiler.options.outDir;
      if (!output) {
        return;
      }

      for (const o of output) {
        const emitFileName = o.fileName;
        const emitFileLoc = path.resolve(destLoc, emitFileName);
        let code: string = (await fs.readFile(emitFileLoc)).toString();
        code = await rewriteExports(code);
        await fs.writeFile(emitFileLoc, code);
      }
    });
  }
}

export { RewriteExportsPlugin };
