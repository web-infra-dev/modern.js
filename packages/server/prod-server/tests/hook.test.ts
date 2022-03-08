import { createRouteAPI } from '../src/libs/hook-api/route';
import { createTemplateAPI } from '../src/libs/hook-api/template';
import { RouteMatchManager } from '../src/libs/route';
import { createDoc } from './helper';
import spec from './fixtures/route-spec/index.json';

describe('test hook api', () => {
  test('should route api work correctly', () => {
    const manager = new RouteMatchManager();
    manager.reset(spec.routes);
    const matcher = manager.match('/home');

    const routeAPI = createRouteAPI(matcher!, manager, '');
    expect(routeAPI.cur().entryName).toBe('home');
    expect(routeAPI.get('entry')?.entryPath).toBe('html/entry/index.html');

    expect(routeAPI.use('home')).toBeTruthy();
    expect(routeAPI.cur().entryName).toBe('home');
  });

  test('should template api work correctly', () => {
    const content = createDoc();
    const templateAPI = createTemplateAPI(content);

    expect(templateAPI.get()).toMatch(content);

    templateAPI.replace('mock', 'replace');
    expect(templateAPI.get()).toMatch('replace');

    templateAPI.appendBody('after body');
    templateAPI.prependBody('before body');
    templateAPI.appendHead('after head');
    templateAPI.prependHead('before head');

    const newContent = templateAPI.get();
    expect(newContent).toMatch('<head>before head');
    expect(newContent).toMatch('<body>before body');
    expect(newContent).toMatch('after head</head>');
    expect(newContent).toMatch('after body</body>');

    templateAPI.set('<div>empty</div>');
    expect(templateAPI.get()).toBe('<div>empty</div>');
  });
});
