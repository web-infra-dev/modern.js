import fse from 'fs-extra';
import { Libuilder, loadConfig } from '@modern-js/libuild';
import type { ILibuilder, Chunk, CLIConfig } from '@modern-js/libuild';
import { expect } from './expect';
import { waitForEqual } from './waitForEqual';

export interface ILibuilderTest extends ILibuilder {
  getOutputByCondition: (
    predicate: (outputFilePath: string, chunk: Chunk) => boolean,
  ) => Record<string, Chunk>;
  getCSSOutput: () => Record<string, Chunk>;
  expectCSSOutputMatchSnapshot: () => void;
  getJSOutput: () => Record<string, Chunk>;
  expectJSOutputMatchSnapshot: () => void;
  /**
   *
   * @param filePath path of the **JavaScript** file to be written.
   * @param content content of written to file.
   */
  testRebuild: (filePath: string, content: string) => Promise<void>;
}
export const getLibuilderTest = async (
  params: CLIConfig,
  name?: string,
): Promise<ILibuilderTest> => {
  if (!params.input) {
    params.input = {
      main: './index.ts',
    };
  }
  const userConfig = await loadConfig(params);
  if (Array.isArray(userConfig)) {
    throw new Error('Detect multiply config.');
  }
  const bundler = (await Libuilder.create(
    userConfig,
    name,
  )) as unknown as ILibuilderTest;

  bundler.testRebuild = async function (filePath, content) {
    fse.writeFileSync(filePath, content);

    await waitForEqual(() => {
      // Try to get `outputChunk`, but it may failed.
      // For example, you will get empty Map after `startCompilation`,
      // then the `jsOutput` is `{}`.
      const jsOutput = bundler.getJSOutput();
      const jsChunk = Object.values(jsOutput);
      if (jsChunk.length === 1) {
        return jsChunk[0].contents.toString('utf-8');
      }
      const RANDOM_STRING = 'yr79w4tug347fbaer';
      return RANDOM_STRING;
    }, content);
  };

  bundler.getOutputByCondition = function (predicate) {
    return Object.fromEntries(
      Array.from(bundler.outputChunk).filter(([outputFilePath, chunk]) =>
        predicate(outputFilePath, chunk),
      ),
    );
  };

  bundler.getCSSOutput = function () {
    return bundler.getOutputByCondition(outputFilePath =>
      outputFilePath.endsWith('.css'),
    );
  };

  bundler.expectCSSOutputMatchSnapshot = function () {
    Object.values(bundler.getCSSOutput()).forEach(({ contents }) => {
      expect(contents.toString()).toMatchSnapshot();
    });
  };

  bundler.getJSOutput = function () {
    return bundler.getOutputByCondition(outputFilePath =>
      outputFilePath.endsWith('.js'),
    );
  };
  bundler.expectJSOutputMatchSnapshot = function () {
    Object.values(bundler.getJSOutput()).forEach(({ contents }) => {
      expect(contents).toMatchSnapshot();
    });
  };

  return bundler;
};
