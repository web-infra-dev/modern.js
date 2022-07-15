import { sourceSchema } from './source';
import { outputSchema } from './output';
import { toolsSchema } from './tools';

export const addSchema = () => [
  ...sourceSchema,
  ...outputSchema,
  ...toolsSchema,
];
