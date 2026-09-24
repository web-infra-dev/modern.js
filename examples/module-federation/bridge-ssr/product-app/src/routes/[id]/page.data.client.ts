import type { LoaderFunctionArgs } from '@modern-js/runtime/router';
import { loadProduct } from '../../services/commerce';
export const loader = (args: LoaderFunctionArgs) => loadProduct(args);
