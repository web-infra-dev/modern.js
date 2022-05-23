import { sourceSchema } from './source';
import { outputSchema } from './output';
import { moduleSchema } from './module';

export const addSchema = () => [...sourceSchema, ...outputSchema, ...moduleSchema];
