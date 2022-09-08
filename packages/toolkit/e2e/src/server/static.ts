import os from 'os';
import http from 'http';
import fs from 'fs';
import serveStaticImpl from 'serve-static';
import { Volume } from 'memfs/lib/volume';
import { nanoid } from 'nanoid';
import path from 'path';

export interface ServeStaticOptions<
  R extends http.ServerResponse = http.ServerResponse,
> extends serveStaticImpl.ServeStaticOptions<R> {
  fs?: any;
}

function serveStatic<R extends http.ServerResponse>(
  root: string,
  options?: ServeStaticOptions<R>,
): serveStaticImpl.RequestHandler<R> {
  const ofs = options?.fs ?? fs;
  if (ofs !== fs) {
    const tempDir = fs.realpathSync(os.tmpdir());
    const outputDir = path.resolve(tempDir, 'modern-js-e2e', nanoid());
    if (ofs instanceof Volume) {
      const files = ofs.toJSON(root, undefined, true);
      for (const [filename, data] of Object.entries(files)) {
        data && fs.writeFileSync(
          path.resolve(outputDir, filename), data
        );
      }
    } else {
      throw new Error('Unsupported filesystem.');
    }
  }
  const _root = root;
  return serveStaticImpl(_root, options);
}

export default serveStatic;
