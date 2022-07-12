import path from 'path';
import { fs } from '@modern-js/utils';
import { esmpack, getEntryFilename } from '../src';
import { installPackage, preparePackage } from './npm';
import { getTempDir } from './paths';

// jest.setTimeout(60000);

export interface UnitTestInfo {
  pkgName: string;
  pkgVersion: string;
  specifier: string;
  installType?: 'package-only' | 'normal-install';
}

export function createUnitTest({
  pkgName,
  pkgVersion,
  specifier,
  installType = 'package-only',
}: UnitTestInfo) {
  const ONE_SECOND = 1000;
  const ONE_MINUTE = 60 * ONE_SECOND;
  let timeout = ONE_MINUTE;
  if (installType === 'normal-install') {
    timeout = 3 * ONE_MINUTE;
  }
  it(
    `should work with ${specifier}`,
    async done => {
      const workDir = getTempDir();
      const install = (() => {
        switch (installType) {
          case 'normal-install': {
            return installPackage;
          }
          case 'package-only':
          default:
            return preparePackage;
        }
      })();
      await install(workDir, pkgName, pkgVersion);
      let hasError = false;
      try {
        await esmpack({
          specifier,
          cwd: workDir,
        });
      } catch (e) {
        hasError = true;
        throw e;
      }
      expect(hasError).toBe(false);
      const distDir = path.resolve(workDir, 'dist');
      const targetFilePath = path.resolve(distDir, getEntryFilename(specifier));
      expect(fs.existsSync(targetFilePath)).toBe(true);
      expect(fs.readFileSync(targetFilePath).toString()).toMatchSnapshot();
      done();
    },
    timeout,
  );
}
