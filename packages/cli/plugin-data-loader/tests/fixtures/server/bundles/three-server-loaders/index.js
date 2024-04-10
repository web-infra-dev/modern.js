const { Response } = require('@remix-run/node');

const loader0 = async () => {
  return {
    message: 'loader0',
  };
};

const loader1 = async () => {
  return new Response('loader1');
};

const loader3 = async ({ params }) => {
  return params.id;
};

const loader4 = () => {
  throw new Error('throw error by loader4');
  // eslint-disable-next-line no-unreachable
  return new Response('loader4');
};

const routes = [
  {
    path: '/',
    children: [
      {
        path: 'user',
        children: [
          {
            path: ':id',
            children: [
              {
                path: 'profile',
                id: 'user/[id]/profile/layout',
                type: 'nested',
              },
            ],
            id: 'user/[id]/layout',
            loader: loader3,
            type: 'nested',
          },
          {
            path: 'profile',
            children: [
              {
                _component:
                  '@_modern_js_src/three/routes/user/profile/page.tsx',
                index: true,
                id: 'user/profile/page',
                type: 'nested',
              },
            ],
            _component: '@_modern_js_src/three/routes/user/profile/layout.tsx',
            loader: loader0,
            id: 'user/profile/layout',
            type: 'nested',
          },
        ],
        error: '@_modern_js_src/three/routes/user/error.tsx',
        _component: '@_modern_js_src/three/routes/user/layout.tsx',
        loader: loader1,
        id: 'user/layout',
        type: 'nested',
      },
      {
        path: 'user/profile/name',
        _component: '@_modern_js_src/three/routes/user.profile.name/layout.tsx',
        id: 'user.profile.name/layout',
        type: 'nested',
        loader: loader4,
      },
    ],
    _component: '@_modern_js_src/three/routes/layout.tsx',
    loading: '@_modern_js_src/three/routes/loading.tsx',
    id: 'layout',
    type: 'nested',
  },
];

module.exports = {
  routes,
};
