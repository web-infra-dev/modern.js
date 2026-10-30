import { createMemoryRouter, redirect } from '@modern-js/runtime-utils/router';
import type { NestedRoute, ServerRoute } from '@modern-js/types';
import { createActionRequest } from '../src/cli/createRequest';
import { handleRequest } from '../src/runtime';

describe('action redirects', () => {
  afterEach(() => {
    rstest.unstubAllGlobals();
  });

  describe.each(['/', '/app'])('with basename %s', basename => {
    test.each(['return', 'throw'])(
      'navigates after an action uses %s redirect',
      async mode => {
        const action = rstest.fn(() => {
          if (mode === 'throw') {
            throw redirect('/dashboard');
          }
          return redirect('/dashboard');
        });
        const routes: NestedRoute[] = [
          { path: '/edit', id: 'edit/page', type: 'nested', action },
          { path: '/dashboard', id: 'dashboard/page', type: 'nested' },
        ];
        const serverRoutes: ServerRoute[] = [
          {
            urlPath: basename,
            entryName: 'main',
            entryPath: 'html/main/index.html',
          },
        ];

        rstest.stubGlobal('fetch', async (url: URL, init: RequestInit) => {
          const response = await handleRequest({
            request: new Request(url, init),
            serverRoutes,
            routes,
            context: {
              monitors: undefined as any,
              loaderContext: new Map(),
            },
          });
          if (!response) {
            throw new Error('Expected an action response');
          }
          return response;
        });

        const prefix = basename === '/' ? '' : basename;
        const router = createMemoryRouter(
          [
            {
              path: '/edit',
              id: 'edit/page',
              action: createActionRequest('edit/page'),
            },
            { path: '/dashboard', id: 'dashboard/page' },
          ],
          { basename, initialEntries: [`${prefix}/edit`] },
        );

        try {
          await router.navigate('/edit', {
            formMethod: 'post',
            formData: new FormData(),
          });

          expect(action).toHaveBeenCalledTimes(1);
          expect(router.state.errors).toBeNull();
          expect(router.state.location.pathname).toBe(`${prefix}/dashboard`);
        } finally {
          router.dispose();
        }
      },
    );
  });
});
