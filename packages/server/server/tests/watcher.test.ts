import * as path from 'path';
import { fs } from '@modern-js/utils';
import Watcher from '../src/dev-tools/watcher';

jest.useRealTimers();

describe('watcher', () => {
  let watcher: Watcher;
  jest.setTimeout(25000);
  beforeAll(() => {
    watcher = new Watcher();
  });

  test('should emit change', done => {
    const pwd = path.join(__dirname, './fixtures/pure');
    const serverDir = path.normalize(path.join(pwd, './tmp-server'));

    const callback = jest.fn();
    if (fs.pathExistsSync(serverDir)) {
      fs.removeSync(serverDir);
    }
    const writeFiles = () => {
      fs.writeFileSync(
        path.normalize(path.join(serverDir, 'index.js')),
        'test',
        'utf8',
      );
    };

    const clear = () => {
      fs.removeSync(serverDir);
    };

    fs.mkdirSync(serverDir);

    watcher.listen(
      [`${serverDir}/**/*`],
      {
        ignoreInitial: true,
        ignored: /api\/typings\/.*/,
      },
      async () => {
        callback();
        expect(callback).toHaveBeenCalledTimes(1);
        await watcher.close();
        clear();
        done();
      },
    );

    setTimeout(writeFiles, 100);
  });

  test('should not emit change when typings file changed', done => {
    const pwd = path.join(__dirname, './fixtures/pure');
    const apiDir = path.normalize(path.join(pwd, './api'));

    const callback = jest.fn();

    if (fs.pathExistsSync(apiDir)) {
      fs.removeSync(apiDir);
    }

    const writeFiles = () => {
      fs.writeFileSync(
        path.normalize(path.join(apiDir, 'typings/index.js')),
        'test',
        'utf8',
      );
    };

    const clear = () => {
      fs.removeSync(apiDir);
    };

    fs.mkdirSync(path.normalize(path.join(apiDir, 'typings')), {
      recursive: true,
    });

    watcher.listen(
      [`${apiDir}/**/*`],
      {
        ignoreInitial: true,
        ignored: /api\/typings\/.*/,
      },
      callback,
    );

    setTimeout(async () => {
      expect(callback).toHaveBeenCalledTimes(0);
      await watcher.close();
      clear();
      done();
    }, 1000);

    setTimeout(writeFiles);
  });
});
