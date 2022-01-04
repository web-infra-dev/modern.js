import { RouteMatchManager, RouteMatcher } from '../src/libs/route';
import spec from './fixtures/route-spec/index.json';

describe('test route', () => {
  describe('test route matcher', () => {
    test('should matcher work correctyl with simple spec', () => {
      const routeSpec = spec.routes[0];
      const matcher = new RouteMatcher(routeSpec);
      expect(matcher.spec).toBe(routeSpec);
      expect(matcher.urlPath).toBe(routeSpec.urlPath);
      expect(matcher.urlReg).toBeUndefined();
      expect(matcher.urlMatcher).toBeUndefined();

      const { isSSR, isApi, isSPA, urlPath, entryName, entryPath } =
        matcher.generate();

      expect(isSSR).toBeTruthy();
      expect(isApi).toBeFalsy();
      expect(isSPA).toBeTruthy();
      expect(urlPath).toBe(routeSpec.urlPath);
      expect(entryName).toBe(routeSpec.entryName);
      expect(entryPath).toBe(routeSpec.entryPath);

      expect(matcher.matchEntry('entry')).toBeTruthy();
      expect(matcher.matchEntry('home')).toBeFalsy();
      expect(matcher.matchLength('/entry')).toBe(6);
      expect(matcher.matchUrlPath('/entry')).toBeTruthy();
      expect(matcher.matchUrlPath('/home')).toBeFalsy();
    });
  });

  describe('test route manager', () => {
    test('should manager work correctly with simple spec', async () => {
      const manager = new RouteMatchManager();
      expect(manager.matchers.length).toBe(0);
      manager.reset(spec.routes);
      expect(manager.matchers.length).toBe(3);

      const matchedByEntry = manager.matchEntry('home');
      expect(matchedByEntry).toBeDefined();
      expect(matchedByEntry?.generate().entryName).toBe('home');

      const matchedByUrl = manager.match('/entry');
      expect(matchedByUrl).toBeDefined();
      expect(matchedByUrl?.generate().entryName).toBe('entry');

      const SSRUrlBundles = manager.getBundles();
      expect(SSRUrlBundles).toEqual(['bundles/entry.js', 'bundles/home.js']);

      manager.reset([]);
      expect(manager.matchers.length).toBe(0);
    });
  });
});
