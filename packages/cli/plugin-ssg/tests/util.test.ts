import {
  formatOutput,
  formatPath,
  isDynamicUrl,
  getUrlPrefix,
  getOutput,
  replaceWithAlias,
  standardOptions,
  openRouteSSR,
} from '../src/libs/util';

describe('test ssg util function', () => {
  it('should return format path correctly', () => {
    const f1 = formatPath('foo');
    expect(f1).toBe('/foo');

    const f2 = formatPath('/foo/');
    expect(f2).toBe('/foo');

    const f3 = formatPath('foo/');
    expect(f3).toBe('/foo');

    const f4 = formatPath('./foo');
    expect(f4).toBe('/foo');

    const f5 = formatPath('/');
    expect(f5).toBe('/');

    const f6 = formatPath(1 as any);
    expect(f6).toBe(1);
  });

  it('should detect dynamic url correctly', () => {
    const d1 = isDynamicUrl('/:foo');
    expect(d1).toBe(true);

    const d2 = isDynamicUrl('/foo');
    expect(d2).toBe(false);
  });

  it('should get url base correctly', () => {
    const r1: any = { entryName: 'main' };
    expect(getUrlPrefix(r1, '/')).toBe('');
    expect(getUrlPrefix(r1, '/base')).toBe('/base');

    const r2: any = { entryName: 'home' };
    expect(getUrlPrefix(r2, '/')).toBe('/home');
    expect(getUrlPrefix(r2, '/base')).toBe('/base/home');
  });

  it('should get output correctly', () => {
    const r1: any = { urlPath: '/foo/a' };
    expect(getOutput(r1, '', true)).toBe('foo/a');
    expect(getOutput(r1, '/foo', true)).toBe('a');
    expect(getOutput(r1, '/foo/a', true)).toBe('');

    const r2 = {
      urlPath: '/foo/a',
      output: './foo/a.html',
    };
    expect(getOutput(r2 as any, '', false)).toBe(r2.output);
    expect(getOutput(r2 as any, '/foo', true)).toBe(r2.output);
  });

  it('should return format output correctly', () => {
    const entryPath1 = '/base/home/index.html';
    expect(formatOutput(entryPath1)).toBe(entryPath1);

    const entryPath2 = '/base/home';
    expect(formatOutput(entryPath2)).toBe(entryPath1);
  });

  it('should replace alias correctly', () => {
    expect(replaceWithAlias('/src', '/src/app.js', '@src')).toBe('@src/app.js');
  });

  it('should standard user config correctly', () => {
    const opt0 = standardOptions(false, []);
    expect(opt0).toBeFalsy();

    const opt1 = standardOptions(true, [{ entryName: 'main', entry: '' }]);
    expect(opt1).toEqual({ main: true });

    const opt2 = standardOptions(true, [
      { entryName: 'main', entry: '' },
      { entryName: 'home', entry: '' },
    ]);
    expect(opt2).toEqual({ main: true, home: true });

    const opt3 = standardOptions(true, [
      { entryName: 'main', entry: '' },
      { entryName: 'home', entry: '' },
    ]);
    expect(opt3).toEqual({ main: true, home: true });

    // single entry, object config
    const ssg1 = {
      routes: ['/foo', { url: '/baz' }],
    };
    const opt4 = standardOptions(ssg1, [{ entryName: 'main', entry: '' }]);
    expect(opt4).toEqual({ main: ssg1 });

    // error usage, just test
    const ssg2 = {
      routes: ['/foo', { url: '/baz' }],
    };
    const opt5 = standardOptions(ssg2, [
      { entryName: 'main', entry: '' },
      { entryName: 'home', entry: '' },
    ]);
    expect(opt5).toEqual(ssg2);

    const ssg3 = {
      main: { routes: ['/foo', { url: '/baz' }] },
      home: false,
    };
    const opt6 = standardOptions(ssg3, [
      { entryName: 'main', entry: '' },
      { entryName: 'home', entry: '' },
    ]);
    expect(opt6).toEqual(ssg3);

    const ssg4 = () => true;
    const opt7 = standardOptions(ssg4, [
      { entryName: 'main', entry: '' },
      { entryName: 'home', entry: '' },
    ]);
    expect(opt7).toEqual({ main: true, home: true });

    const ssg5 = (entryName: string) => {
      if (entryName === 'main') {
        return true;
      } else {
        return {
          routes: ['/foo'],
        };
      }
    };
    const opt8 = standardOptions(ssg5, [
      { entryName: 'main', entry: '' },
      { entryName: 'home', entry: '' },
    ]);
    expect(opt8).toEqual({ main: true, home: { routes: ['/foo'] } });
  });

  it('should get ssr route correctly', () => {
    const ssrRoutes = openRouteSSR([
      {
        isSSR: false,
        entryName: 'a',
      },
    ] as any);

    expect(ssrRoutes[0].isSSR).toBeFalsy();
    expect(ssrRoutes[0].bundle).toBeDefined();

    const ssrRoutesByEntries = openRouteSSR(
      [
        {
          isSSR: false,
          entryName: 'a',
        },
      ] as any,
      ['a'],
    );

    expect(ssrRoutesByEntries[0].isSSR).toBeTruthy();
    expect(ssrRoutesByEntries[0].bundle).toBeDefined();
  });
});
