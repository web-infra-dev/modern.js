import { resolve } from 'path';
import { parse } from 'acorn';
import { fs } from '@modern-js/utils';
import {
  AcornParseError,
  SyntaxError,
  generateError,
  printErrors,
  getEcmaVersion,
  generateHtmlScripts,
  checkIsExcludeSource,
  CheckSyntaxExclude,
} from './helpers';
import { JS_REGEX, HTML_REGEX } from '../../constants';
import { EcmaVersion, CheckSyntaxOptions } from '../../types';
import type { Compiler, Compilation } from 'webpack';

export class CheckSyntaxPlugin {
  errors: SyntaxError[] = [];

  ecmaVersion: EcmaVersion;

  targets: string[];

  rootPath: string;

  exclude: CheckSyntaxExclude | undefined;

  constructor(
    options: CheckSyntaxOptions &
      Required<Pick<CheckSyntaxOptions, 'targets' | 'exclude'>> & {
        rootPath: string;
      },
  ) {
    this.targets = options.targets;
    this.exclude = options.exclude;
    this.rootPath = options.rootPath;
    this.ecmaVersion = options.ecmaVersion || getEcmaVersion(this.targets);
  }

  apply(complier: Compiler) {
    complier.hooks.afterEmit.tapPromise(
      CheckSyntaxPlugin.name,
      async (compilation: Compilation) => {
        const outputPath = compilation.outputOptions.path || 'dist';
        // not support compilation.emittedAssets in Rspack
        const emittedAssets = compilation
          .getAssets()
          .filter(a => a.source)
          .map(a => a.name)
          .map(p => resolve(outputPath, p));

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
          if (!checkIsExcludeSource(filepath, this.exclude)) {
            await this.tryParse(filepath, script);
          }
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
      parse(code, { ecmaVersion: this.ecmaVersion });
    } catch (_: unknown) {
      const err = _ as AcornParseError;

      const error = await generateError({
        err,
        code,
        filepath,
        exclude: this.exclude,
        rootPath: this.rootPath,
      });

      if (error) {
        this.errors.push(error);
      }
    }
  }
}
