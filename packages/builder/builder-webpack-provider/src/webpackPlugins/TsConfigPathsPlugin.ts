/**
 * modified from https://github.com/dividab/tsconfig-paths-webpack-plugin
 * license at https://github.com/dividab/tsconfig-paths-webpack-plugin/blob/master/LICENSE
 */
import path from 'path';
import { logger } from '@modern-js/builder-shared';
import { readTsConfig, isRelativePath } from '@modern-js/utils';
import { createMatchPath, MatchPath } from '@modern-js/utils/tsconfig-paths';
import type { Resolver } from 'webpack';

export type TsConfigPathsPluginOptions = {
  cwd?: string;
  extensions?: string[];
  mainFields?: string[];
};

export class TsConfigPathsPlugin {
  cwd: string;

  extensions: string[];

  compilerOptions: {
    paths?: Record<string, string[]>;
    baseUrl?: string;
  };

  absoluteBaseUrl: string;

  matchPath: MatchPath | null;

  resolved: Map<string, string | undefined>;

  constructor({
    cwd = process.cwd(),
    extensions = ['.ts', '.tsx'],
    mainFields = ['browser', 'module', 'main'],
  }: TsConfigPathsPluginOptions) {
    this.cwd = cwd;
    this.extensions = extensions;
    this.resolved = new Map();
    this.compilerOptions = readTsConfig(cwd).compilerOptions || {};
    this.absoluteBaseUrl = path.resolve(
      cwd,
      this.compilerOptions.baseUrl || './',
    );

    // if paths is not configured, do not create matchPath method
    const { paths } = this.compilerOptions;
    if (paths) {
      this.matchPath = createMatchPath(
        this.absoluteBaseUrl,
        paths,
        mainFields,
        false,
      );
    } else {
      this.matchPath = null;
    }
  }

  apply(resolver: Resolver) {
    if (this.matchPath === null) {
      return;
    }

    if (!resolver) {
      logger.warn(
        '[TsConfigPathsPlugin]: Found no resolver, not apply TsConfigPathsPlugin.',
      );
    }

    const target = resolver.ensureHook('resolve');

    resolver
      .getHook('described-resolve')
      .tapAsync('TsConfigPathsPlugin', (request, resolveContext, callback) => {
        const requestName = request.request;

        if (!requestName) {
          return callback();
        }

        if (isRelativePath(requestName)) {
          return callback();
        }

        if (path.isAbsolute(requestName)) {
          return callback();
        }

        if (!this.resolved.has(requestName)) {
          const matched = this.matchPath!(
            requestName,
            undefined,
            undefined,
            this.extensions,
          );

          this.resolved.set(requestName, matched);
        }

        if (this.resolved.get(requestName) === undefined) {
          return callback();
        }

        return resolver.doResolve(
          target,
          {
            ...request,
            request: this.resolved.get(requestName),
          },
          `Aliased with tsconfig.json ${requestName} to ${this.resolved.get(
            requestName,
          )!}`,
          resolveContext,
          (resolverErr: any, resolvedResult?: any) => {
            if (resolverErr) {
              return callback(resolverErr);
            }

            if (!resolvedResult) {
              return callback(undefined, undefined);
            }

            return callback(undefined, resolvedResult);
          },
        );
      });
  }
}
