import { removeTailSlash } from '@modern-js/utils';
import {
  MatchFunction,
  MatchResult,
  match,
  pathToRegexp,
} from 'path-to-regexp';
import { toPath } from '../../utils';
import { ModernRoute, ModernRouteInterface } from './route';

// eslint-disable-next-line no-useless-escape
const regCharsDetector = /[^a-zA-Z\-_0-9\/\.]/;
export class RouteMatcher {
  public spec: ModernRouteInterface;

  public urlPath: string = '';

  public urlMatcher?: MatchFunction;

  public urlReg?: RegExp;

  constructor(spec: ModernRouteInterface) {
    this.spec = spec;
    this.setupUrlPath();
  }

  // generate modern route object
  public generate(url: string) {
    const route = new ModernRoute(this.spec);

    if (this.urlPath) {
      const params = this.parseURLParams(url);
      route.urlPath = toPath(route.urlPath, params);
      route.params = params;
    }

    return route;
  }

  public parseURLParams(pathname: string) {
    if (!this.urlMatcher) {
      return {};
    } else {
      const matchResult = this.urlMatcher(pathname);

      return (matchResult as MatchResult<Record<string, string>>).params;
    }
  }

  // get match url length
  public matchLength(pathname: string): number | null {
    if (!this.urlReg) {
      return this.urlPath.length;
    } else {
      const result = this.urlReg.exec(pathname);
      return result?.[0]?.length || null;
    }
  }

  // if match url path
  public matchUrlPath(requestUrl: string): boolean {
    const urlWithoutSlash =
      requestUrl.endsWith('/') && requestUrl !== '/'
        ? requestUrl.slice(0, -1)
        : requestUrl;

    if (this.urlMatcher) {
      return Boolean(this.urlMatcher(urlWithoutSlash));
    } else {
      if (urlWithoutSlash.startsWith(this.urlPath)) {
        // avoid /abcd match /a
        if (
          this.urlPath !== '/' &&
          urlWithoutSlash.length > this.urlPath.length &&
          !urlWithoutSlash.startsWith(`${this.urlPath}/`)
        ) {
          return false;
        }

        return true;
      }

      return false;
    }
  }

  public matchEntry(entryName: string): boolean {
    return this.spec.entryName === entryName;
  }

  // compiler urlPath to regexp if necessary
  private setupUrlPath() {
    const { urlPath } = this.spec;
    this.urlPath = urlPath === '/' ? urlPath : removeTailSlash(urlPath);

    const useReg = regCharsDetector.test(urlPath);
    if (useReg) {
      this.urlMatcher = match(urlPath, {
        end: false,
        decode: decodeURIComponent,
      });

      this.urlReg = pathToRegexp(urlPath, [], {
        end: false,
      });
    }
  }
}
