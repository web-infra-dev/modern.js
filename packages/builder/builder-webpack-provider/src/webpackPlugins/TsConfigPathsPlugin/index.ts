/**
 * The following code is modified based on
 * https://github.com/dividab/tsconfig-paths-webpack-plugin
 *
 * MIT Licensed
 * Author Michael Jackson
 * Copyright (c) 2016 Jonas Kello
 * https://github.com/dividab/tsconfig-paths-webpack-plugin/blob/master/LICENSE
 *
 * https://github.com/wre232114/enhanced-tsconfig-paths-webpack-plugin/
 *
 * MIT Licensed
 * Author wre232114
 * Copyright (c) 2021 wre232114
 * https://github.com/wre232114/enhanced-tsconfig-paths-webpack-plugin/blob/main/LICENSE
 */
import path from 'path';
import { logger } from '@modern-js/builder-shared';
import { readTsConfig, isRelativePath } from '@modern-js/utils';
import { createMatchPath, MatchPath } from '@modern-js/utils/tsconfig-paths';
import type { Resolver } from 'webpack';
import { TsconfigLoader } from './TsconfigLoader';

export type TsConfigPathsPluginOptions = {
  cwd?: string;
  extensions?: string[];
  mainFields?: string[];
  /**
   * ignore files under node_modules, default to true
   */
  ignoreNodeModules?: boolean;
  loadClosestTsConfig?: boolean;
  /**
   * tsconfigPaths options
   */
  tsconfigPaths?: {
    matchAll?: boolean;
  };
};

export class TsConfigPathsPlugin {
  cwd: string;

  extensions: string[];

  compilerOptions: {
    paths?: Record<string, string[]>;
    baseUrl?: string;
  };

  absoluteBaseUrl: string;

  // current project matchPath instance
  matchPath: MatchPath | null;

  resolvedCache: Map<string, string | undefined>;

  #ignoreNodeModules: boolean;

  #loadClosestTsConfig: boolean;

  // monorepo sub projects matcher
  #matchers: Record<string, MatchPath> = {};

  #loader: TsconfigLoader = new TsconfigLoader();

  #options: TsConfigPathsPluginOptions;

  constructor(options: TsConfigPathsPluginOptions) {
    const {
      cwd = process.cwd(),
      extensions = ['.ts', '.tsx'],
      mainFields = ['browser', 'module', 'main'],
      loadClosestTsConfig = false,
      ignoreNodeModules = true,
    } = options;

    this.cwd = cwd;
    this.extensions = extensions;
    this.resolvedCache = new Map();
    this.compilerOptions = readTsConfig(cwd).compilerOptions || {};
    this.absoluteBaseUrl = path.resolve(
      cwd,
      this.compilerOptions.baseUrl || './',
    );
    this.#loadClosestTsConfig = loadClosestTsConfig;
    this.#ignoreNodeModules = ignoreNodeModules;
    this.#options = options;

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
    if (this.matchPath === null && !this.#loadClosestTsConfig) {
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

        const issuerDir: string | undefined =
          // @ts-expect-error context is exsited, but the internal type do not provide it, so we ignore it for now
          (request.context?.issuer && path.dirname(request.context?.issuer)) ||
          request.path;
        // Filter the files from node_modules,
        // the remaining files are the files of the current project and the files of the monorepo subprojects
        if (
          !issuerDir ||
          (this.#ignoreNodeModules &&
            issuerDir &&
            issuerDir.includes('node_modules'))
        ) {
          return callback();
        }

        let resolvedPath = this.resolvedCache.get(requestName);

        // match current project
        if (issuerDir.includes(this.cwd)) {
          if (this.matchPath === null) {
            return callback();
          }
          if (resolvedPath === undefined) {
            resolvedPath = this.matchPath(
              requestName,
              undefined,
              undefined,
              this.extensions,
            );
          }
        } else if (this.#loadClosestTsConfig && resolvedPath === undefined) {
          // match monorepo sub project files and match node_modules files when ignoreNodeModules is false.

          const tsconfig = this.#loader.load(issuerDir);
          if (!tsconfig?.baseUrl) {
            return callback();
          }

          if (!this.#matchers[tsconfig.configFileAbsolutePath]) {
            this.#matchers[tsconfig.configFileAbsolutePath] = createMatchPath(
              tsconfig.absoluteBaseUrl,
              tsconfig.paths,
              this.#options.mainFields,
              this.#options?.tsconfigPaths?.matchAll,
            );
          }

          resolvedPath = this.#matchers[tsconfig.configFileAbsolutePath](
            requestName,
            undefined,
            undefined,
            this.#options.extensions,
          );
        }

        if (resolvedPath) {
          this.resolvedCache.set(requestName, resolvedPath);
        } else {
          return callback();
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
