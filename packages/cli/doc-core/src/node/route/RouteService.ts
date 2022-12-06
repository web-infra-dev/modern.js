import path from 'path';
import { normalizePath } from '../utils';

export const DEFAULT_PAGE_EXTENSIONS = ['js', 'jsx', 'ts', 'tsx', 'md', 'mdx'];

export interface RouteMeta {
  routePath: string;
  basePath: string;
  absolutePath: string;
}

export interface RouteOptions {
  extensions?: string[];
  include?: string[];
  exclude?: string[];
}

export const addLeadingSlash = (str: string) => {
  return str.startsWith('/') ? str : `/${str}`;
};

export const normalizeRoutePath = (routePath: string) => {
  const normalizedRoutePath = routePath
    .replace(/\.(.*)?$/, '')
    .replace(/index$/, '');
  return addLeadingSlash(normalizedRoutePath);
};

export class RouteService {
  #scanDir: string;

  #routeData: RouteMeta[] = [];

  #extensions: string[] = [];

  #include: string[] = [];

  #exclude: string[] = [];

  constructor(scanDir: string, options: RouteOptions = {}) {
    this.#scanDir = scanDir;
    this.#extensions = options.extensions || DEFAULT_PAGE_EXTENSIONS;
    this.#include = options.include || [];
    this.#exclude = options.exclude || [];
  }

  async init() {
    const globby = await import('@modern-js/utils/globby');
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
    const routePath = normalizeRoutePath(fileRelativePath);
    const absolutePath = path.join(this.#scanDir, fileRelativePath);

    this.#routeData.push({
      routePath,
      basePath: this.#scanDir,
      absolutePath: normalizePath(absolutePath),
    });
  }

  removeRoute(filePath: string) {
    const fileRelativePath = path.relative(this.#scanDir, filePath);
    const routePath = normalizeRoutePath(fileRelativePath);
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

  generateRoutesCode(ssr?: boolean) {
    return `
import React from 'react';
import loadable from '@loadable/component';
${this.#routeData
  .map((route, index) => {
    return ssr
      ? `import * as Route${index} from '${route.absolutePath}';`
      : `const Route${index} = loadable(() => import('${route.absolutePath}'))`;
  })
  .join('\n')}
export const routes = [
${this.#routeData
  .map((route, index) => {
    // In ssr, we don't need to import component dynamically.
    const preload = ssr ? `() => Route${index}` : `Route${index}.preload`;
    const component = ssr ? `Route${index}.default` : `Route${index}`;
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
