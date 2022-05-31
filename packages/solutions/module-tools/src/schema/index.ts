import { sourceSchema } from './source';
import { outputSchema } from './output';

export const addSchema = () => [...sourceSchema, ...outputSchema];
