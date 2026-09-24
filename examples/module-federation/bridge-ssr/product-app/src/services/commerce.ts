import type { LoaderFunctionArgs } from '@modern-js/runtime/router';

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  status: 'on_sale' | 'draft';
  color: string;
  updatedAt: string;
}
export interface ProductList {
  items: Product[];
  total: number;
  page: number;
  pageSize: number;
  categories: string[];
}
export interface ProductSummary {
  total: number;
  onSale: number;
  draft: number;
  averagePrice: number;
}
export interface ProductData {
  list: ProductList;
  filters: { q: string; category: string; status: string };
  summary: ProductSummary | Promise<ProductSummary>;
}
const origin = process.env.COMMERCE_API_ORIGIN || 'http://127.0.0.1:4500';
export async function commerce<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${origin}/api/commerce/${path}`, {
    ...options,
    headers: options.body
      ? { 'Content-Type': 'application/json', ...options.headers }
      : options.headers,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || '请求未完成，请重试');
  return data as T;
}
export async function loadProducts({ request }: LoaderFunctionArgs) {
  const query = new URL(request.url).searchParams;
  const filters = {
    q: query.get('q') || '',
    category: query.get('category') || '',
    status: query.get('status') || '',
  };
  const list = await commerce<ProductList>(
    `products?${new URLSearchParams({ ...filters, page: query.get('page') || '1' })}`,
    { signal: request.signal },
  );
  // This is the real report request, intentionally deferred until its response arrives.
  const summary = commerce<ProductSummary>(
    `summary?delay=${encodeURIComponent(query.get('streamDelay') || '0')}`,
    { signal: request.signal },
  );
  return { list, filters, summary };
}
export async function loadProduct({ params, request }: LoaderFunctionArgs) {
  return commerce<Product>(`products/${encodeURIComponent(params.id || '')}`, {
    signal: request.signal,
  });
}
export function money(cents: number) {
  return `¥${(cents / 100).toFixed(2)}`;
}
export function updatedAt(value: string) {
  return new Date(new Date(value).getTime() + 8 * 3600000)
    .toISOString()
    .slice(0, 16)
    .replace('T', ' ');
}
