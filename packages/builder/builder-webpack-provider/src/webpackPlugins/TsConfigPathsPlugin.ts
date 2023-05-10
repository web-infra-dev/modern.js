/**
 * The following code is modified based on
 * https://github.com/dividab/tsconfig-paths-webpack-plugin
 *
 * MIT Licensed
 * Author Michael Jackson
 * Copyright (c) 2016 Jonas Kello
 * https://github.com/dividab/tsconfig-paths-webpack-plugin/blob/master/LICENSE
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

  resolvedCache: Map<string, string | undefined>;

  constructor({
    cwd = process.cwd(),
    extensions = ['.ts', '.tsx'],
    mainFields = ['browser', 'module', 'main'],
  }: TsConfigPathsPluginOptions) {
    this.cwd = cwd;
    this.extensions = extensions;
    this.resolvedCache = new Map();
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

        if (
          !requestName ||
          isRelativePath(requestName) ||
          path.isAbsolute(requestName)
        ) {
          return callback();
        }

        let resolvedPath = this.resolvedCache.get(requestName);

        if (resolvedPath === undefined) {
          resolvedPath = this.matchPath!(
            requestName,
            undefined,
            undefined,
            this.extensions,
          );

          if (resolvedPath) {
            this.resolvedCache.set(requestName, resolvedPath);
          } else {
            return callback();
          }
        }

        return resolver.doResolve(
          target,
          {
            ...request,
            request: resolvedPath,
          },
          `Aliased with tsconfig.json ${requestName} to ${resolvedPath}`,
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
