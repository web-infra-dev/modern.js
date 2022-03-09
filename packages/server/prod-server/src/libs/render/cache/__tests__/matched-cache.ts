export const matchedCacheableAry = [
  [
    {
      requestOpt: {
        url: '/level-one',
        headers: {},
        query: { name: 'byted' },
      },
      cacheConfig: {
        level: 1,
        includes: { query: ['name'] },
        matches: { query: { name: { weixin: '^byted' } } },
      },
      content: 'level1',
    },
    {
      url: '/level-one',
      headers: {},
      query: { name: 'byted_likely' },
    },
    {
      url: '/level-one',
      headers: {},
      query: { name: 'not_byted' },
    },
  ],
  [
    {
      requestOpt: {
        url: '/level-two',
        query: {},
        headers: { age: '17' },
      },
      cacheConfig: {
        level: 2,
        includes: { header: ['age'] },
        matches: { header: { age: { one: '^1' } } },
      },
      content: 'level2',
    },
    {
      url: '/level-two',
      query: {},
      headers: { age: '11' },
    },
    {
      url: '/level-two',
      query: {},
      headers: { age: '22' },
    },
  ],
  [
    {
      requestOpt: {
        url: '/level-three',
        headers: { age: '17' },
        query: { name: 'byted' },
      },
      cacheConfig: {
        level: 3,
        includes: {
          query: ['name'],
          header: ['age'],
        },
        matches: {
          query: { name: { weixin: '^byted' } },
          header: { age: { one: '^1' } },
        },
      },
      content: 'level3',
    },
    {
      url: '/level-three',
      query: { name: 'byted_likely' },
      headers: { age: '19' },
    },
    {
      url: '/level-three',
      query: { name: 'byted_likely' },
      headers: {},
    },
    {
      url: '/level-three',
      query: { name: 'not_byted' },
      headers: { age: '19' },
    },
  ],
];
