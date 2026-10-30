import type {
  AppNormalizedConfig,
  AppToolsContext,
} from '@modern-js/app-tools';
import { createProdServer } from '@modern-js/prod-server';
import { logger } from '@modern-js/utils';
import { createServer } from '../src/server';
import type { SsgRoute } from '../src/types';

rstest.mock('@modern-js/prod-server', () => ({
  createProdServer: rstest.fn(),
  loadServerPlugins: rstest.fn().mockResolvedValue([]),
}));

it('skips non-2xx responses without losing the route-to-HTML alignment', async () => {
  const statuses = [200, 404, 201, 302, 500];
  const routes: SsgRoute[] = statuses.map(status => ({
    urlPath: `/status-${status}`,
    entryName: 'main',
    entryPath: 'html/index.html',
    output: `html/${status}.html`,
  }));
  rstest.mocked(createProdServer).mockResolvedValue({
    getRequestHandler: () => async (request: Request) => {
      const status = Number(new URL(request.url).pathname.split('-')[1]);
      return new Response(`response ${status}`, { status });
    },
  } as any);
  const warn = rstest.spyOn(logger, 'warn').mockImplementation(() => {});
  const result = await createServer(
    {
      distDirectory: '/tmp/ssg',
      appDirectory: '/tmp/ssg',
      serverPlugins: [],
    } as unknown as AppToolsContext,
    routes,
    [],
    [],
    {} as AppNormalizedConfig,
  );
  expect(result).toEqual([
    'response 200',
    undefined,
    'response 201',
    undefined,
    undefined,
  ]);
  for (const status of [404, 302, 500]) {
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining(`/status-${status}`),
    );
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining(`HTTP ${status}`),
    );
  }
});
