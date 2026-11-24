import { defineRuntimeConfig } from '@modern-js/runtime';

export default defineRuntimeConfig((entryName: string) => {
  if (entryName === 'memory-csr') {
    return {
      router: {
        memory: {
          initialEntries: [
            '/',
            {
              pathname: '/user/42',
              search: '?tab=csr',
              state: { from: 'initial' },
            },
          ],
          initialIndex: 1,
        },
      },
    };
  }
  if (entryName === 'memory-ssr') {
    return {
      router: {
        memory: {
          initialEntries: [
            '/',
            {
              pathname: '/user/42',
              search: '?tab=ssr',
              state: { from: 'ssr-card' },
            },
          ],
          initialIndex: 1,
        },
      },
    };
  }
  return {};
});
