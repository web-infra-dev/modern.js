export const moduleSchema = [
  {
    target: 'module',
    schema: {
      type: 'array',
      items: [{ type: 'object', properties: {
        'target': {
          enum: [
            'es6',
            'es5',
            'es2015',
            'es2016',
            'es2017',
            'es2018',
            'es2019',
            'es2020',
            'esnext',
          ],
        },
        'format': {
          enum: ['cjs', 'esm', 'iife'],
        },
        'sourceMap': {
          type: 'boolean',
        },
        'bundle': {
          type: 'boolean',
        },
        'entry': {
          type: 'string',
        },
      }}]
    }
  },
];

