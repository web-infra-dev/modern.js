import { buildSchema } from './build-config';

const PACKAGE_MODE_LIST = [
  'universal-js',
  'universal-js-lite',
  'browser-js',
  'browser-js-lite',
  'node-js',
];

export const outputSchema = [
  /** packageMode will deprecated */
  {
    target: 'output.packageMode',
    schema: { enum: PACKAGE_MODE_LIST },
  },
  /** packageFields will deprecated */
  {
    target: 'output.packageFields',
    schema: { typeof: 'object' },
  },
  /** enableSourceMap will deprecated */
  {
    target: 'output.enableSourceMap',
    schema: { typeof: 'boolean' },
  },
  /** importStyle will deprecated */
  {
    target: 'output.importStyle',
    schema: {
      enum: ['compiled-code', 'source-code'],
    },
  },
  /** assetsPath will deprecated */
  {
    target: 'output.assetsPath',
    schema: {
      typeof: 'string',
      default: 'styles',
    },
  },
  ...buildSchema,
];
