import { addSnopshotSerializer } from '@scripts/vitest-config';
import { expect } from 'vitest';

addSnopshotSerializer(expect);
