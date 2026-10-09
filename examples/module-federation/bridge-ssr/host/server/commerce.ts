import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

let database: DatabaseSync | undefined;
export function db() {
  if (database) return database;
  const directory = path.resolve(process.cwd(), '.data');
  mkdirSync(directory, { recursive: true });
  database = new DatabaseSync(path.join(directory, 'commerce.sqlite'));
  database.exec(`
    PRAGMA journal_mode=WAL;
    CREATE TABLE IF NOT EXISTS products (id TEXT PRIMARY KEY,name TEXT NOT NULL,category TEXT NOT NULL,price INTEGER NOT NULL,status TEXT NOT NULL,color TEXT NOT NULL,updatedAt TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS inventory (sku TEXT NOT NULL,warehouse TEXT NOT NULL,available INTEGER NOT NULL,reserved INTEGER NOT NULL,threshold INTEGER NOT NULL,PRIMARY KEY(sku,warehouse));
    CREATE TABLE IF NOT EXISTS movements (id INTEGER PRIMARY KEY AUTOINCREMENT,sku TEXT NOT NULL,warehouse TEXT NOT NULL,delta INTEGER NOT NULL,reason TEXT NOT NULL,createdAt TEXT NOT NULL);
  `);
  if (
    (
      database.prepare('SELECT count(*) AS n FROM products').get() as {
        n: number;
      }
    ).n === 0
  ) {
    const rows = [
      ['SH-1001', '折叠露营椅', '户外生活', 18900, 'on_sale', '#d8e5dc'],
      ['SH-1002', '轻量保温随行杯', '生活器具', 12900, 'on_sale', '#e4ddd0'],
      ['SH-1003', '原木收纳边桌', '家居收纳', 29900, 'on_sale', '#d9ccb8'],
      ['SH-1004', '帆布周末旅行包', '户外生活', 25900, 'on_sale', '#d5dce8'],
      ['SH-1005', '玻璃手冲咖啡壶', '生活器具', 15900, 'draft', '#d8e5e9'],
      ['SH-1006', '多格桌面收纳盒', '家居收纳', 6900, 'on_sale', '#ecd7c9'],
      ['SH-1007', '便携户外营灯', '户外生活', 21900, 'on_sale', '#e5ddbd'],
      ['SH-1008', '棉麻餐垫四件套', '生活器具', 7900, 'draft', '#e7e1d8'],
      ['SH-1009', '防水野餐垫', '户外生活', 11900, 'on_sale', '#cdded9'],
      ['SH-1010', '陶瓷早餐碗', '生活器具', 5900, 'on_sale', '#d9d5e6'],
      ['SH-1011', '窄边落地置物架', '家居收纳', 35900, 'on_sale', '#d4dce2'],
      ['SH-1012', '天然棉布储物袋', '家居收纳', 3900, 'draft', '#e8decf'],
      ['SH-1013', '双层露营便当盒', '户外生活', 9900, 'on_sale', '#b9cfc4'],
      ['SH-1014', '磨砂玻璃水杯', '生活器具', 4900, 'on_sale', '#c9dbe9'],
      ['SH-1015', '模块化抽屉分隔板', '家居收纳', 4500, 'on_sale', '#dfd2c4'],
      ['SH-1016', '旅行洗漱收纳包', '户外生活', 8900, 'draft', '#d9cddd'],
      ['SH-1017', '不锈钢量勺套装', '生活器具', 3500, 'on_sale', '#d1d7dc'],
      ['SH-1018', '实木衣帽挂钩', '家居收纳', 7900, 'on_sale', '#cfbea5'],
    ];
    const product = database.prepare(
      'INSERT INTO products VALUES (?,?,?,?,?,?,?)',
    );
    const stock = database.prepare('INSERT INTO inventory VALUES (?,?,?,?,?)');
    database.exec('BEGIN');
    rows.forEach((row, index) => {
      product.run(...row, '2026-09-24T08:00:00.000Z');
      for (const [warehouse, n] of [
        ['杭州主仓', 0],
        ['上海前置仓', 1],
      ] as const) {
        stock.run(
          row[0],
          warehouse,
          index % 5 === 0 ? 8 + n * 3 : 60 + index * 17 + n * 11,
          3 + index * 2,
          30,
        );
      }
    });
    database
      .prepare(
        'INSERT INTO movements(sku,warehouse,delta,reason,createdAt) VALUES (?,?,?,?,?)',
      )
      .run('SH-1001', '杭州主仓', 80, '采购入库', '2026-09-24T07:35:00.000Z');
    database.exec('COMMIT');
  }
  return database;
}
export function listProducts(
  search: string,
  category: string,
  status: string,
  page: number,
) {
  const filters = ['name LIKE ?'];
  const values: (string | number)[] = [`%${search}%`];
  if (category) {
    filters.push('category = ?');
    values.push(category);
  }
  if (status) {
    filters.push('status = ?');
    values.push(status);
  }
  const where = filters.join(' AND ');
  const total = (
    db()
      .prepare(`SELECT count(*) AS n FROM products WHERE ${where}`)
      .get(...values) as { n: number }
  ).n;
  const items = db()
    .prepare(
      `SELECT * FROM products WHERE ${where} ORDER BY id LIMIT 6 OFFSET ?`,
    )
    .all(...values, (page - 1) * 6);
  return {
    items,
    total,
    page,
    pageSize: 6,
    categories: ['户外生活', '生活器具', '家居收纳'],
  };
}
export function productSummary() {
  return db()
    .prepare(
      "SELECT count(*) AS total,sum(status='on_sale') AS onSale,sum(status='draft') AS draft,round(avg(price)) AS averagePrice FROM products",
    )
    .get();
}
export function inventory(warehouse: string) {
  const items = db()
    .prepare(
      'SELECT i.*,p.name,p.category,p.color FROM inventory i JOIN products p ON p.id=i.sku WHERE warehouse=? ORDER BY available,i.sku',
    )
    .all(warehouse);
  return {
    items,
    warehouse,
    warehouses: ['杭州主仓', '上海前置仓'],
    summary: db()
      .prepare(
        'SELECT sum(available) AS available,sum(reserved) AS reserved,sum(available < threshold) AS low,count(*) AS skus FROM inventory WHERE warehouse=?',
      )
      .get(warehouse),
  };
}
export function adjustInventory(
  sku: string,
  warehouse: string,
  delta: number,
  reason: string,
) {
  if (
    !Number.isInteger(delta) ||
    Math.abs(delta) > 10000 ||
    !delta ||
    !reason.trim()
  )
    throw new Error('请填写有效的调整数量和原因');
  const record = db()
    .prepare('SELECT available FROM inventory WHERE sku=? AND warehouse=?')
    .get(sku, warehouse) as { available: number } | undefined;
  if (!record || record.available + delta < 0)
    throw new Error('库存记录不存在或可用库存不足');
  db().exec('BEGIN');
  try {
    db()
      .prepare(
        'UPDATE inventory SET available=available+? WHERE sku=? AND warehouse=?',
      )
      .run(delta, sku, warehouse);
    db()
      .prepare(
        'INSERT INTO movements(sku,warehouse,delta,reason,createdAt) VALUES(?,?,?,?,?)',
      )
      .run(sku, warehouse, delta, reason.trim(), new Date().toISOString());
    db().exec('COMMIT');
  } catch (error) {
    db().exec('ROLLBACK');
    throw error;
  }
}
