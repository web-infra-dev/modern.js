import type { LoaderFunctionArgs } from '@modern-js/runtime/router';
import { loadInventory } from '../services/inventory';
export const loader = (args: LoaderFunctionArgs) => loadInventory(args);
