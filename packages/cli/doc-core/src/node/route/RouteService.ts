import path from 'path';
import type { ComponentType } from 'react';
import { getPageKey, normalizePath } from '../utils';
import { PageModule, UserConfig } from '@/shared/types';
import { withBase } from '@/shared/utils';

export const DEFAULT_PAGE_EXTENSIONS = ['js', 'jsx', 'ts', 'tsx', 'md', 'mdx'];

export interface RouteMeta {
  routePath: string;
  basePath: string;
  absolutePath: string;
  pageName: string;
}

export interface Route {
  path: string;
  element: React.ReactElement;
  filePath: string;
  preload: () => Promise<PageModule<ComponentType<unknown>>>;
}

export interface RouteOptions {
  extensions?: string[];
  include?: string[];
  exclude?: string[];
}

export const addLeadingSlash = (str: string) => {
  return str.startsWith('/') ? str : `/${str}`;
};

export const normalizeRoutePath = (
  routePath: string,
  lang: string,
  base: string,
): string => {
  const normalizedRoutePath = routePath
    // extract lang prefix
    .replace(new RegExp(`^${lang}`), '')
    // remove the extension
    .replace(/\.[^.]+$/, '')
    // remove index
    .replace(/index$/, '');

  return withBase(addLeadingSlash(normalizedRoutePath), base);
};

export class RouteService {
  #scanDir: string;

  #defaultLang: string;

  #routeData: RouteMeta[] = [];

  #extensions: string[] = [];

  #include: string[] = [];

  #exclude: string[] = [];

  #base: string = '';

  constructor(scanDir: string, userConfig: UserConfig) {
    const routeOptions = userConfig.doc?.route || {};
    this.#scanDir = scanDir;
    this.#extensions = routeOptions.extensions || DEFAULT_PAGE_EXTENSIONS;
    this.#include = routeOptions.include || [];
    this.#exclude = routeOptions.exclude || [];
    this.#defaultLang = userConfig.doc?.lang || 'zh';
    this.#base = userConfig.doc?.base || '';
  }

  async init() {
    const { default: globby } = await import('@modern-js/utils/globby');
    const files = globby
      .sync([`**/*.{${this.#extensions.join(',')}}`, ...this.#include], {
        cwd: this.#scanDir,
        absolute: true,
        ignore: [...this.#exclude],
      })
      .sort();
    files.forEach(file => this.addRoute(file));
  }

  addRoute(filePath: string) {
    const fileRelativePath = normalizePath(
      path.relative(this.#scanDir, filePath),
    );
    const routePath = normalizeRoutePath(
      fileRelativePath,
      this.#defaultLang,
      this.#base,
    );
    const absolutePath = path.join(this.#scanDir, fileRelativePath);

    this.#routeData.push({
      routePath,
      basePath: this.#scanDir,
      absolutePath: normalizePath(absolutePath),
      pageName: getPageKey(routePath),
    });
  }

  removeRoute(filePath: string) {
    const fileRelativePath = path.relative(this.#scanDir, filePath);
    const routePath = normalizeRoutePath(
      fileRelativePath,
      this.#defaultLang,
      this.#base,
    );
    this.#routeData = this.#routeData.filter(
      route => route.routePath !== routePath,
    );
  }

  getRoutes() {
    return this.#routeData;
  }

  isExistRoute(routePath: string) {
    return this.#routeData.find(route => route.routePath === routePath);
  }

  generateRoutesCode(isStaticImport?: boolean) {
    return `
import React from 'react';
import { lazyWithPreload } from "react-lazy-with-preload";
${this.#routeData
  .map((route, index) => {
    return isStaticImport
      ? `import * as Route${index} from '${route.absolutePath}';`
      : `const Route${index} = lazyWithPreload(() => import(/* webpackChunkName: "${route.pageName}" */'${route.absolutePath}'))`;
  })
  .join('\n')}
export const routes = [
${this.#routeData
  .map((route, index) => {
    // In ssr, we don't need to import component dynamically.
    const preload = isStaticImport
      ? `() => Route${index}`
      : `async () => { 
        await Route${index}.preload();
        return import("${route.absolutePath}");
      }`;
    const component = isStaticImport
      ? `Route${index}.default`
      : `Route${index}`;
    /**
     * For SSR, example:
     * {
     *   route: '/',
     *   element: jsx(Route0),
     *   preload: Route0.preload,
     *   filePath: '/Users/xxx/xxx/index.md'
     * }
     *
     * For client render, example:
     * {
     *   route: '/',
     *   element: jsx(Route0.default),
     *   preload: Route0.preload,
     *   filePath: '/Users/xxx/xxx/index.md'
     * }
     */
    return `{ path: '${route.routePath}', element: React.createElement(${component}), filePath: '${route.absolutePath}', preload: ${preload} }`;
  })
  .join(',\n')}
];
`;
  }
}
