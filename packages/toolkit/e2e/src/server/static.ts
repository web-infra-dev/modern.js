import os from 'os';
import http from 'http';
import fs from 'fs';
import serveStaticImpl from 'serve-static';
import { Volume } from 'memfs/lib/volume';
import { nanoid } from 'nanoid';
import path from 'path';
import { createFsFromVolume } from 'memfs';

export interface ServeStaticOptions<
  R extends http.ServerResponse = http.ServerResponse,
> extends serveStaticImpl.ServeStaticOptions<R> {
  volume?: Volume;
}

function serveStaticMiddle<R extends http.ServerResponse>(
  root: string,
  options?: ServeStaticOptions<R>,
): serveStaticImpl.RequestHandler<R> {
  const ofs = options?.volume ? createFsFromVolume(options.volume) : fs;
  let _root = root;
  if (ofs !== fs) {
    const tempDir = fs.realpathSync(os.tmpdir());
    const outputDir = path.resolve(tempDir, 'modern-js-e2e', nanoid());
    _root = outputDir;
    if (options?.volume) {
      const files = options.volume.toJSON(root, undefined, true);
      for (const [filename, data] of Object.entries(files)) {
        if (data) {
          const filepath = path.resolve(outputDir, filename);
          fs.mkdirSync(path.dirname(filepath), { recursive: true });
          fs.writeFileSync(filepath, data);
        }
      }
    } else {
      throw new Error('Unsupported filesystem.');
    }
  }
  return serveStaticImpl(_root, options);
}

export default serveStaticMiddle;
