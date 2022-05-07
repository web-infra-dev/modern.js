import { RouteMatchManager, RouteMatcher } from '../src/libs/route';
import spec from './fixtures/route-spec/index.json';
import dynamic from './fixtures/route-spec/dynamic.json';

describe('test route', () => {
  describe('test route matcher', () => {
    test('should matcher work correctly with simple spec', () => {
      const routeSpec = spec.routes[0];
      const matcher = new RouteMatcher(routeSpec);
      expect(matcher.spec).toBe(routeSpec);
      expect(matcher.urlPath).toBe(routeSpec.urlPath);
      expect(matcher.urlReg).toBeUndefined();
      expect(matcher.urlMatcher).toBeUndefined();

      const { isSSR, isApi, isSPA, urlPath, entryName, entryPath } =
        matcher.generate('');

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
      expect(matchedByEntry?.generate('').entryName).toBe('home');

      const matchedByUrl = manager.match('/entry');
      expect(matchedByUrl).toBeDefined();
      expect(matchedByUrl?.generate('').entryName).toBe('entry');

      const SSRUrlBundles = manager.getBundles();
      expect(SSRUrlBundles).toEqual(['bundles/entry.js', 'bundles/home.js']);

      manager.reset([]);
      expect(manager.matchers.length).toBe(0);
    });

    test('should manager work correctly with dynamic spec', async () => {
      const manager = new RouteMatchManager();
      expect(manager.matchers.length).toBe(0);
      manager.reset(dynamic.routes);
      expect(manager.matchers.length).toBe(1);

      const matched = manager.match('/entry/001');
      expect(matched).toBeDefined();
      const route = matched?.generate('/entry/001');
      expect(route?.entryName).toBe('entry');
      expect(route?.params).toEqual({ id: '001' });

      const matchedWithTrail = manager.match('/entry/001/a');
      expect(matchedWithTrail).toBeDefined();
      const routeWithTrail = matchedWithTrail?.generate('/entry/001/a');
      expect(routeWithTrail?.entryName).toBe('entry');
      expect(routeWithTrail?.params).toEqual({ id: '001' });

      const miss = manager.match('/entry');
      expect(miss).toBeUndefined();
    });
  });
});
