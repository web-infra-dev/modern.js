/**
 * @jest-environment node
 */
import fs from 'fs';
import path from 'path';

const projectRoot = path.resolve(__dirname, '../../..');

const readFixture = (relativePath: string) =>
  fs.readFileSync(path.join(projectRoot, relativePath), 'utf8');

const assertTanstackLoaderContract = (code: string) => {
  expect(code).toContain('function modernLoaderToTanstack');
  expect(code).toContain('function createRouteStaticData');
  expect(code).toContain('ctx?.abortController?.signal');
  expect(code).toContain('ctx?.signal ||');
  expect(code).toContain('new Request(href, { signal })');
  expect(code).toContain('mapParamsForModernLoader');
  expect(code).toContain('const { _splat, ...rest } = params as any');
  expect(code).toContain("return { ...rest, '*': _splat }");
  expect(code).toContain('if (isRedirectResponse(result))');
  expect(code).toContain('throwTanstackRedirect(location)');
  expect(code).toContain('if (result.status === 404)');
  expect(code).toContain('throw notFound()');
  expect(code).toContain('staticData: createRouteStaticData({');
  expect(code).toContain('modernRouteId:');
};

describe('tanstack generated data-flow contracts', () => {
  test('string mode router bridges modern loaders to tanstack semantics', () => {
    const code = readFixture(
      'integration/routes-tanstack/src/modern-tanstack/string/router.gen.ts',
    );

    assertTanstackLoaderContract(code);
    expect(code).toContain("path: 'mutation'");
    expect(code).toContain('route_string_mutation_page');
    expect(code).toContain('modernRouteAction: action_');
    expect(code).toContain('createRouter({');
  });

  test('stream mode router preserves redirect and notFound mappings', () => {
    const code = readFixture(
      'integration/routes-tanstack/src/modern-tanstack/stream/router.gen.ts',
    );

    assertTanstackLoaderContract(code);
    expect(code).toContain('route_stream_redirect_page');
    expect(code).toContain('route_stream_user__id__page');
    expect(code).toContain('createRouter({');
  });
});
