export const cacheabelAry = [
  {
    requestOpt: { url: '/' },
    cacheConfig: {},
    content: 'level0',
  },
  {
    requestOpt: {
      url: '/level-one',
      query: { name: 'modern' },
    },
    cacheConfig: {
      level: 1,
      includes: { query: ['name'] },
    },
    content: 'level1',
  },
  {
    requestOpt: {
      url: '/level-two',
      headers: { age: '18' },
    },
    cacheConfig: {
      level: 2,
      includes: { header: ['age'] },
    },
    content: 'level2',
  },
  {
    requestOpt: {
      url: '/level-three',
      query: { name: 'modern' },
      headers: { age: '18' },
    },
    cacheConfig: {
      level: 3,
      includes: {
        query: ['name'],
        header: ['age'],
      },
    },
    content: 'level3',
  },
];
