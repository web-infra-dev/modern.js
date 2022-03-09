import { RouteMatcher } from './matcher';
import { ModernRoute, ModernRouteInterface } from './route';

export class RouteMatchManager {
  public matchers: RouteMatcher[];

  private specs: ModernRouteInterface[] = [];

  constructor() {
    this.matchers = [];
  }

  // get all routes matches pathname
  private filter(pathname: string) {
    return this.matchers.reduce((matches, matcher) => {
      if (matcher.matchUrlPath(pathname)) {
        matches.push(matcher);
      }
      return matches;
    }, [] as RouteMatcher[]);
  }

  // get best match from a set of matches
  private best(pathname: string, matches: RouteMatcher[]) {
    let best: RouteMatcher | undefined;
    let matchedLen = 0;

    for (const match of matches) {
      const len = match.matchLength(pathname);

      if (len === null) {
        continue;
      }

      if (len > matchedLen) {
        best = match;
        matchedLen = len;
      }
    }

    return best;
  }

  // reset routes matcher
  public reset(specs: ModernRouteInterface[]) {
    this.specs = specs;
    const matchers = specs.reduce((ms, spec) => {
      ms.push(new RouteMatcher(spec));
      return ms;
    }, [] as RouteMatcher[]);

    this.matchers = matchers;
  }

  // get best match from all matcher in manager
  public match(pathname: string) {
    const matches = this.filter(pathname);
    const best = this.best(pathname, matches);
    return best;
  }

  public matchEntry(entryname: string) {
    return this.matchers.find(matcher => matcher.matchEntry(entryname));
  }

  public getBundles() {
    const bundles = this.specs
      .filter(route => route.isSSR)
      .map(route => route.bundle);

    return bundles;
  }
}

export type { ModernRouteInterface, ModernRoute };
export { RouteMatcher };
