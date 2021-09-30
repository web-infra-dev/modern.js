import { compile } from '../server/prerender';
import { SsgRoute } from '../types';

export function makeRender(
  ssgRoutes: SsgRoute[],
  render: ReturnType<typeof compile>,
  port: number,
): Promise<string>[] {
  return ssgRoutes.map((ssgRoute: SsgRoute) =>
    render({
      url: ssgRoute.urlPath,
      headers: { host: `localhost:${port}`, ...ssgRoute.headers },
      connection: {},
    }),
  );
}
