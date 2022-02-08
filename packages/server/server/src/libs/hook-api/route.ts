import { RouteMatchManager, RouteMatcher } from '../route';

class RouteAPI {
  private readonly router: RouteMatchManager;

  private current: RouteMatcher;

  private readonly url: string;

  constructor(matched: RouteMatcher, router: RouteMatchManager, url: string) {
    this.current = matched;
    this.router = router;
    this.url = url;
  }

  public cur() {
    return this.current.generate(this.url);
  }

  public get(entryName: string) {
    const { router } = this;
    const matched = router.matchEntry(entryName);
    return matched ? matched.generate(this.url) : null;
  }

  public use(entryName: string) {
    const { router } = this;
    const matched = router.matchEntry(entryName);
    if (matched) {
      this.current = matched;
      return true;
    } else {
      return false;
    }
  }
}

export const createRouteAPI = (
  matched: RouteMatcher,
  router: RouteMatchManager,
  url: string,
) => new RouteAPI(matched, router, url);
