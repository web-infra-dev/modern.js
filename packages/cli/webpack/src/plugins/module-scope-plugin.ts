/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * modified from https://github.com/facebook/create-react-app/blob/master/packages/react-dev-utils/ModuleScopePlugin.js
 */
import { dirname, relative, resolve } from 'path';
import { chalk } from '@modern-js/utils';

export class ModuleScopePlugin {
  appSrcs: Array<string | RegExp>;

  allowedFiles: Set<string>;

  allowedDirs: string[];

  allowedPatterns: RegExp[];

  relativeAllowedDirs: string[];

  // cache validated paths for performance
  cache: Map<string, boolean>;

  constructor({
    appSrc,
    allowedFiles = [],
  }: {
    appSrc: string | Array<string | RegExp>;
    allowedFiles?: string[];
  }) {
    this.appSrcs = Array.isArray(appSrc) ? appSrc : [appSrc];
    this.allowedFiles = new Set(allowedFiles);
    this.allowedDirs = this.appSrcs.filter(
      src => typeof src === 'string',
    ) as string[];
    this.allowedPatterns = this.appSrcs.filter(
      src => Object.prototype.toString.call(src) === '[object RegExp]',
    ) as RegExp[];
    this.relativeAllowedDirs = this.allowedDirs.map(
      allowedDir => `${relative(dirname(allowedDir), allowedDir)}/`,
    );
    this.cache = new Map();
  }

  apply(resolver: any) {
    const { allowedFiles, allowedDirs, allowedPatterns, relativeAllowedDirs } =
      this;
    resolver.hooks.file.tapAsync(
      'ModuleScopePlugin',
      (request: any, contextResolver: any, callback: any) => {
        const { issuer } = request.context;

        // Unknown issuer, probably webpack internals
        if (!issuer || this.cache.get(issuer)) {
          return callback();
        }

        this.cache.set(issuer, true);

        if (
          // If this resolves to a node_module, we don't care what happens next
          request.descriptionFileRoot.indexOf('/node_modules/') !== -1 ||
          request.descriptionFileRoot.indexOf('\\node_modules\\') !== -1 ||
          !request.__innerRequest_request
        ) {
          return callback();
        }

        // Resolve the issuer from our appSrc and make sure it's one of our files
        // Maybe an indexOf === 0 would be better?
        if (
          allowedDirs.every(allowedDir => {
            const result = relative(allowedDir, issuer);
            // If it's not in one of our app src or a subdirectory, not our request!
            return result.startsWith('../') || result.startsWith('..\\');
          })
        ) {
          return callback();
        }

        const requestFullPath = resolve(
          dirname(issuer),
          request.__innerRequest_request,
        );

        // allowed pattern
        if (
          allowedPatterns.some(allowedPattern =>
            allowedPattern.test(requestFullPath),
          )
        ) {
          return callback();
        }
        // allowed files
        if (allowedFiles.has(requestFullPath)) {
          return callback();
        }
        // Find path from src to the requested file
        // Error if in a parent directory of all given appSrcs
        if (
          allowedDirs.every(allowedDir => {
            const requestRelative = relative(allowedDir, requestFullPath);
            return (
              requestRelative.startsWith('../') ||
              requestRelative.startsWith('..\\')
            );
          })
        ) {
          let message = `You attempted to import ${chalk.bold(
            request.__innerRequest_request,
          )} which is not allowed. `;
          if (allowedDirs.length) {
            message += `Allowed dirs: ${chalk.bold(
              relativeAllowedDirs.join(','),
            )}. `;
          }
          if (allowedPatterns.length) {
            message += `Allowed patterns: ${chalk.bold(
              allowedPatterns.map(p => p.toString()).join(','),
            )}. `;
          }
          message += `Please check the source.moduleScopes configuration.`;
          const scopeError = new Error(message);
          Object.defineProperty(scopeError, '__module_scope_plugin', {
            value: true,
            writable: false,
            enumerable: false,
          });
          // remove invalid path from cache
          this.cache.set(issuer, false);
          return callback(scopeError, request);
        } else {
          return callback();
        }
      },
    );
  }
}
