import { RouteMatchManager, RouteMatcher } from '../route';

class RouteAPI {
  private readonly router: RouteMatchManager;

  private current: RouteMatcher;

  constructor(matched: RouteMatcher, router: RouteMatchManager) {
    this.current = matched;
    this.router = router;
  }

  public cur() {
    return this.current.generate();
  }

  public get(entryName: string) {
    const { router } = this;
    const matched = router.matchEntry(entryName);
    return matched ? matched.generate() : null;
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
) => new RouteAPI(matched, router);
