import { defineServerConfig } from '@modern-js/server-runtime';
import {
  adjustInventory,
  db,
  inventory,
  listProducts,
  productSummary,
} from './commerce.js';

export default defineServerConfig({
  middlewares: [
    {
      name: 'commerce-api',
      handler: async (c, next) => {
        if (!c.req.path.startsWith('/api/commerce/')) return next();
        c.header('Access-Control-Allow-Origin', '*');
        c.header('Access-Control-Allow-Headers', 'Content-Type');
        c.header('Access-Control-Allow-Methods', 'GET,PATCH,POST,OPTIONS');
        c.header('Cache-Control', 'no-store');
        if (c.req.method === 'OPTIONS') return c.body(null, 204);
        const route = c.req.path.slice('/api/commerce/'.length);
        try {
          if (route === 'products' && c.req.method === 'GET') {
            return c.json(
              listProducts(
                c.req.query('q') || '',
                c.req.query('category') || '',
                c.req.query('status') || '',
                Math.max(1, Number(c.req.query('page')) || 1),
              ),
            );
          }
          if (route === 'summary') {
            // Latency injection is opt-in for streaming acceptance tests only.
            const delay = Math.min(
              5000,
              Math.max(0, Number(c.req.query('delay')) || 0),
            );
            if (delay) await new Promise(resolve => setTimeout(resolve, delay));
            return c.json(productSummary());
          }
          if (route.startsWith('products/')) {
            const id = route.slice(9);
            if (c.req.method === 'PATCH') {
              const input = await c.req.json();
              if (!['on_sale', 'draft'].includes(input.status))
                return c.json({ error: '商品状态无效' }, 400);
              db()
                .prepare('UPDATE products SET status=?,updatedAt=? WHERE id=?')
                .run(input.status, new Date().toISOString(), id);
            }
            const product = db()
              .prepare('SELECT * FROM products WHERE id=?')
              .get(id);
            return product
              ? c.json(product)
              : c.json({ error: '商品不存在' }, 404);
          }
          if (route === 'inventory')
            return c.json(inventory(c.req.query('warehouse') || '杭州主仓'));
          if (route === 'inventory/adjust' && c.req.method === 'POST') {
            const input = await c.req.json();
            adjustInventory(
              input.sku,
              input.warehouse,
              Number(input.delta),
              input.reason || '',
            );
            return c.json({ ok: true });
          }
          if (route === 'activity') {
            const delay = Math.min(
              5000,
              Math.max(0, Number(c.req.query('delay')) || 0),
            );
            if (delay) await new Promise(resolve => setTimeout(resolve, delay));
            return c.json(
              db()
                .prepare(
                  'SELECT m.*,p.name FROM movements m JOIN products p ON m.sku=p.id ORDER BY m.id DESC LIMIT 6',
                )
                .all(),
            );
          }
          return c.json({ error: '接口不存在' }, 404);
        } catch (error) {
          return c.json(
            { error: error instanceof Error ? error.message : String(error) },
            400,
          );
        }
      },
    },
  ],
});
