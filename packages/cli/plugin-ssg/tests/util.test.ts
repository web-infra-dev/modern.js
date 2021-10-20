import {
  formatOutput,
  formatPath,
  isDynamicUrl,
  getUrlPrefix,
  getOutput,
  getSSGRenderLevel,
  parsedSSGConfig,
  replaceWithAlias,
} from '@/libs/util';
import { MODE } from '@/manifest-op';

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
    const entryPath = '/base/home/index.html';
    const onlyBase = formatOutput(entryPath, '');
    expect(onlyBase).toBe(entryPath);

    const noExtention = formatOutput(entryPath, './a');
    expect(noExtention).toBe('/base/home/a/index.html');

    const extention = formatOutput(entryPath, 'a.html');
    expect(extention).toBe('/base/home/a.html');

    const relate_1 = formatOutput(entryPath, '../a.html');
    expect(relate_1).toBe('/base/a.html');

    const relate_2 = formatOutput(entryPath, '../../a.html');
    expect(relate_2).toBe('/a.html');
  });

  it('should get ssg level correctly', () => {
    expect(getSSGRenderLevel(true)).toBe(MODE.LOOSE);
    expect(getSSGRenderLevel('loose')).toBe(MODE.LOOSE);
    expect(getSSGRenderLevel('LOOSE')).toBe(MODE.LOOSE);
  });

  it('should parse ssg config correctly', () => {
    const empty = () => {
      // empty test
    };
    expect(parsedSSGConfig(true).useSSG).toBe(true);
    expect(parsedSSGConfig(true).userHook).toBeInstanceOf(Function);
    expect(parsedSSGConfig(true as any).useSSG).toBe(true);
    expect(parsedSSGConfig(true as any).userHook).toBeInstanceOf(Function);
    expect(parsedSSGConfig(empty).useSSG).toBe(true);
    expect(parsedSSGConfig(empty).userHook).toBe(empty);
  });

  it('should replace alias correctly', () => {
    expect(replaceWithAlias('/src', '/src/app.js', '@src')).toBe('@src/app.js');
  });
});
