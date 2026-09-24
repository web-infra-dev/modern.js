import type { LoaderFunctionArgs } from '@modern-js/runtime/router';
import { loadProducts } from '../services/commerce';
export const loader = (args: LoaderFunctionArgs) => loadProducts(args);
