/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * modified from https://github.com/facebook/create-react-app/blob/master/packages/react-dev-utils/ModuleScopePlugin.js
 */
import { dirname, relative, resolve } from 'path';
import { color } from '@rsbuild/shared';
import { isRegExp, isString } from '@modern-js/utils';

export class ModuleScopePlugin {
  scopes: Array<string | RegExp>;

  allowedFiles: Set<string>;

  allowedDirs: string[];

  allowedPatterns: RegExp[];

  relativeAllowedDirs: string[];

  // cache validated paths for performance
  cache: Map<string, boolean>;

  constructor({
    scopes,
    allowedFiles = [],
  }: {
    scopes: Array<string | RegExp>;
    allowedFiles?: string[];
  }) {
    this.scopes = scopes;
    this.allowedFiles = new Set(allowedFiles);
    this.allowedDirs = scopes.filter(isString);
    this.allowedPatterns = scopes.filter(isRegExp);
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
      (request: any, _context: unknown, callback: any) => {
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
          let message = `You attempted to import ${color.bold(
            request.__innerRequest_request,
          )} which is not allowed. `;
          if (allowedDirs.length) {
            message += `Allowed dirs: ${color.bold(
              relativeAllowedDirs.join(','),
            )}. `;
          }
          if (allowedPatterns.length) {
            message += `Allowed patterns: ${color.bold(
              allowedPatterns.map(p => p.toString()).join(','),
            )}. `;
          }
          message += `Please check the source.moduleScopes configuration.`;
          const scopeError = new Error(message);

          Object.defineProperty(scopeError, 'ModuleScopePlugin', {
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
