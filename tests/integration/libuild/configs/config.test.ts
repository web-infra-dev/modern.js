import fs from 'fs';
import path from 'path';
import { getLibuilderTest, expect, BuildConfig } from '@/toolkit';
import { mapValue } from '@modern-js/libuild-utils';
const PASS_PREFIX = '_';
const casesPath = __dirname;

type CategoryType = {
  name: string;
  /**
   * Tests case list of this category.
   */
  tests: string[];
};

const categories: CategoryType[] = fs
  .readdirSync(casesPath)
  .filter((folder) => !folder.startsWith(PASS_PREFIX))
  .map((name) => {
    let result;
    try {
      result = {
        name,
        tests: fs.readdirSync(path.join(casesPath, name)).filter((folder) => !folder.startsWith(PASS_PREFIX)),
      };
    } catch (err) {}
    return result;
  })
  .filter((value): value is CategoryType => Boolean(value));

function removeAbsolutePath(config: BuildConfig) {
  const remove = (nowPath: string) => path.relative(__dirname, nowPath);
  config.root = remove(config.root);
  config.outdir = remove(config.outdir);
  config.sourceDir = remove(config.sourceDir);
  config.outbase = remove(config.outbase);
  if (config.configFile) {
    config.configFile = remove(config.configFile);
  }
  if (Array.isArray(config.input)) {
    config.input = config.input.map(value => remove(value));
  } else {
    config.input = mapValue(config.input, (value) => remove(value));
  }
}
categories.forEach(({ name, tests }) => {
  describe(`config:${name}:snapshot`, () => {
    tests.forEach((caseName) => {
      it(caseName, async () => {
        const caseDirPath = path.join(casesPath, name, caseName);

        const bundler = await getLibuilderTest({
          root: caseDirPath,
        });
        // remove absolute path
        removeAbsolutePath(bundler.config);
        // delete env
        for (const key in bundler.config.define) {
          if (key.startsWith('process.env.LIBUILD')) {
            delete bundler.config.define[key];
          }
        }

        expect(bundler.config).toMatchSnapshot();
      });
    });
  });
});
