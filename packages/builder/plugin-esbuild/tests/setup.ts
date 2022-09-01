import { expect } from 'vitest';
import { addSnopshotSerializer } from '@scripts/vitest-config';

addSnopshotSerializer(expect);
