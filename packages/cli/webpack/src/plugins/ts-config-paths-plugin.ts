import path from 'path';
import {
  logger,
  readTsConfig,
  isRelativePath,
  createDebugger,
} from '@modern-js/utils';
import { createMatchPath, MatchPath } from 'tsconfig-paths';
import type { ResolveContext, Resolver, ResolveRequest } from './plugin.type';
import { JS_RESOLVE_EXTENSIONS } from '../utils/constants';

const debug = createDebugger('ts-config-paths');

export class TsConfigPathsPlugin {
  source: string;

  target: string;

  cwd: string;

  compilerOptions: any;

  absoluteBaseUrl: string;

  matchPath: MatchPath;

  resolved: Map<string, string | undefined>;

  constructor(cwd: string) {
    this.cwd = cwd;

    this.source = 'described-resolve';

    this.target = 'resolve';

    this.compilerOptions = readTsConfig(cwd).compilerOptions;

    this.absoluteBaseUrl = path.resolve(
      cwd,
      this.compilerOptions.baseUrl || './',
    );

    this.matchPath = createMatchPath(
      this.absoluteBaseUrl,
      this.compilerOptions?.paths || {},
      ['browser', 'module', 'main'],
      false,
    );

    this.resolved = new Map();
  }

  apply(resolver: Resolver) {
    if (!resolver) {
      logger.warn(
        'ts-config-paths-plugin: Found no resolver, not apply ts-config-paths-plugin',
      );
    }

    const target = resolver.ensureHook(this.target);

    resolver
      .getHook('described-resolve')
      .tapAsync(
        'TsConfigPathsPlugin',
        (
          request: ResolveRequest,
          resolveContext: ResolveContext,
          callback: any,
        ) => {
          const requestName = request.request;

          if (
            // If this resolves to a node_module, we don't care what happens next
            request.descriptionFileRoot?.includes('/node_modules/') ||
            request.descriptionFileRoot?.includes('\\node_modules\\') ||
            !requestName
          ) {
            return callback();
          }

          if (isRelativePath(requestName)) {
            return callback();
          }

          if (path.isAbsolute(requestName)) {
            return callback();
          }

          if (!this.resolved.has(requestName)) {
            const matched = this.matchPath(
              requestName,
              undefined,
              undefined,
              JS_RESOLVE_EXTENSIONS,
            );

            this.resolved.set(requestName, matched);
          }

          if (this.resolved.get(requestName) === undefined) {
            return callback();
          }

          debug(
            `resolved ${requestName} to ${this.resolved.get(requestName)!}`,
          );

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
        },
      );
  }
}
