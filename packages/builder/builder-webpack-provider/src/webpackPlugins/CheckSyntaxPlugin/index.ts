import { resolve } from 'path';
import { parse, Options as AcornParseOption } from 'acorn';
import { fs } from '@modern-js/utils';
import {
  AcornParseError,
  SyntaxError,
  generateError,
  printErrors,
  getEcmaVersion,
  generateHtmlScripts,
} from './helpers';
import { webpack } from '../../types';

const HTML_REGEX = /\.html$/;
const JS_REGEX = /\.js$/;

export class CheckSyntaxPlugin {
  errors: SyntaxError[] = [];

  ecmaVersion: number;

  targets: string[];

  constructor(targets: string[]) {
    this.targets = targets;
    this.ecmaVersion = getEcmaVersion(this.targets);
  }

  apply(complier: webpack.Compiler) {
    complier.hooks.afterEmit.tapPromise(
      CheckSyntaxPlugin.name,
      async (compilation: webpack.Compilation) => {
        const outputPath = compilation.outputOptions.path || 'dist';
        const emittedAssets = Array.from(compilation.emittedAssets).map(p =>
          resolve(outputPath, p),
        );
        const files = emittedAssets.filter(
          assets => HTML_REGEX.test(assets) || JS_REGEX.test(assets),
        );
        await Promise.all(
          files.map(async file => {
            await this.check(file);
          }),
        );

        printErrors(this.errors);
      },
    );
  }

  private async check(filepath: string) {
    if (HTML_REGEX.test(filepath)) {
      const htmlScripts = await generateHtmlScripts(filepath);
      await Promise.all(
        htmlScripts.map(async script => {
          await this.tryParse(filepath, script);
        }),
      );
    }

    if (JS_REGEX.test(filepath)) {
      const jsScript = await fs.readFile(filepath, 'utf-8');
      await this.tryParse(filepath, jsScript);
    }
  }

  private async tryParse(filepath: string, code: string) {
    try {
      parse(code, { ecmaVersion: this.ecmaVersion } as AcornParseOption);
    } catch (_: unknown) {
      const err = _ as AcornParseError;

      const error = await generateError({
        err,
        code,
        filepath,
      });

      this.errors.push(error);
    }
  }
}
