import type { LoaderFunctionArgs } from '@modern-js/runtime/router';
export interface StockItem {
  sku: string;
  name: string;
  category: string;
  color: string;
  warehouse: string;
  available: number;
  reserved: number;
  threshold: number;
}
export interface StockList {
  items: StockItem[];
  warehouse: string;
  warehouses: string[];
  summary: { available: number; reserved: number; low: number; skus: number };
}
export interface Movement {
  id: number;
  sku: string;
  name: string;
  warehouse: string;
  delta: number;
  reason: string;
  createdAt: string;
}
export interface InventoryData {
  stock: StockList;
  activity: Movement[] | Promise<Movement[]>;
}
const origin = process.env.COMMERCE_API_ORIGIN || 'http://127.0.0.1:4500';
export async function inventoryApi<T>(
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
export async function loadInventory({ request }: LoaderFunctionArgs) {
  const query = new URL(request.url).searchParams;
  const stock = await inventoryApi<StockList>(
    `inventory?warehouse=${encodeURIComponent(query.get('warehouse') || '杭州主仓')}`,
    { signal: request.signal },
  );
  if (!stock.warehouses.includes(stock.warehouse)) {
    throw new Error('所选仓库不存在，请返回默认仓库后重试。');
  }
  const activity = inventoryApi<Movement[]>(
    `activity?delay=${encodeURIComponent(query.get('activityDelay') || query.get('streamDelay') || '0')}`,
    { signal: request.signal },
  );
  return { stock, activity };
}
export function movementTime(value: string) {
  return new Date(new Date(value).getTime() + 8 * 3600000)
    .toISOString()
    .slice(5, 16)
    .replace('T', ' ');
}
