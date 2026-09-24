import {
  Await,
  useLoaderData,
  useLocation,
  useNavigate,
  useNavigation,
  useRevalidator,
} from '@modern-js/runtime/router';
import { type FormEvent, Suspense, useEffect, useRef, useState } from 'react';
import {
  type InventoryData,
  type Movement,
  type StockItem,
  inventoryApi,
  movementTime,
} from '../services/inventory';
import './inventory.css';

function Adjustment({
  item,
  onClose,
  onSaved,
}: { item: StockItem; onClose: () => void; onSaved: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [delta, setDelta] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    dialog.current?.showModal();
    return () => dialog.current?.close();
  }, []);
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setSaving(true);
    setError('');
    try {
      await inventoryApi('inventory/adjust', {
        method: 'POST',
        body: JSON.stringify({
          sku: item.sku,
          warehouse: item.warehouse,
          delta: Number(delta),
          reason: String(data.get('reason') || '').trim(),
        }),
      });
      onSaved();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '调整失败，请重试');
    } finally {
      setSaving(false);
    }
  }
  const next = item.available + (Number(delta) || 0);
  return (
    <dialog
      className="inv-dialog"
      ref={dialog}
      onCancel={event => {
        if (saving) event.preventDefault();
        else onClose();
      }}
      onClose={onClose}
      aria-labelledby="inv-adjust-title"
    >
      <form onSubmit={save}>
        <header className="inv-dialog-heading">
          <div>
            <span>库存变更</span>
            <h2 id="inv-adjust-title">调整可用库存</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="关闭调整窗口"
          >
            ×
          </button>
        </header>
        <div className="inv-adjust-product">
          <span
            className="inv-product-mark"
            style={{ backgroundColor: item.color }}
            aria-hidden="true"
          >
            {item.name.slice(0, 1)}
          </span>
          <div>
            <strong>{item.name}</strong>
            <small>
              {item.sku} · {item.warehouse}
            </small>
          </div>
        </div>
        <div className="inv-adjust-preview">
          <div>
            <span>当前可用</span>
            <strong>{item.available}</strong>
          </div>
          <span aria-hidden="true">→</span>
          <div>
            <span>调整后</span>
            <strong className={next < 0 ? 'inv-danger' : ''}>{next}</strong>
          </div>
        </div>
        <label className="inv-field">
          <span>调整数量</span>
          <input
            name="delta"
            type="number"
            value={delta}
            onChange={event => setDelta(event.target.value)}
            min={-item.available}
            max={10000}
            step="1"
            placeholder="如 20 或 -10"
            required
          />
          <small>正数增加库存，负数减少库存；调整后不能小于 0。</small>
        </label>
        <label className="inv-field">
          <span>调整原因</span>
          <textarea
            name="reason"
            rows={3}
            placeholder="例如：采购到货入库、盘点差异修正"
            required
            maxLength={120}
          />
        </label>
        {error && (
          <p className="inv-alert" role="alert">
            {error}
          </p>
        )}
        <footer className="inv-dialog-actions">
          <button
            type="button"
            className="inv-button"
            onClick={onClose}
            disabled={saving}
          >
            取消
          </button>
          <button
            className="inv-button inv-primary"
            type="submit"
            disabled={saving || !delta || Number(delta) === 0 || next < 0}
          >
            {saving ? '保存中…' : '确认调整'}
          </button>
        </footer>
      </form>
    </dialog>
  );
}
function Activity({ movements }: { movements: Movement[] }) {
  return (
    <div data-testid="inventory-activity">
      {movements.length ? (
        <ol className="inv-activity-list">
          {movements.map(movement => (
            <li key={movement.id}>
              <span
                className={`inv-movement-sign ${movement.delta > 0 ? 'inv-inbound' : 'inv-outbound'}`}
                aria-hidden="true"
              >
                {movement.delta > 0 ? '↓' : '↑'}
              </span>
              <div className="inv-movement-detail">
                <strong>{movement.name}</strong>
                <p>
                  {movement.reason} <span>· {movement.warehouse}</span>
                </p>
              </div>
              <div className="inv-movement-value">
                <strong
                  className={movement.delta > 0 ? 'inv-positive' : 'inv-danger'}
                >
                  {movement.delta > 0 ? '+' : ''}
                  {movement.delta}
                </strong>
                <time dateTime={movement.createdAt}>
                  {movementTime(movement.createdAt)}
                </time>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <div className="inv-empty">
          <strong>还没有库存流水</strong>
          <p>完成一次库存调整后，变更记录会显示在这里。</p>
        </div>
      )}
    </div>
  );
}
export default function InventoryPage() {
  const { stock, activity } = useLoaderData() as InventoryData;
  const location = useLocation();
  const navigate = useNavigate();
  const navigation = useNavigation();
  const revalidator = useRevalidator();
  const [search, setSearch] = useState('');
  const [lowOnly, setLowOnly] = useState(false);
  const [selected, setSelected] = useState<StockItem | null>(null);
  const [notice, setNotice] = useState('');
  const busy = navigation.state !== 'idle' || revalidator.state !== 'idle';
  const keyword = search.trim().toLowerCase();
  const items = stock.items.filter(
    item =>
      (!keyword ||
        `${item.name} ${item.sku}`.toLowerCase().includes(keyword)) &&
      (!lowOnly || item.available < item.threshold),
  );
  function warehouse(value: string) {
    const query = new URLSearchParams(location.search);
    query.set('warehouse', value);
    navigate({ search: `?${query}` });
    setNotice('');
  }
  function saved() {
    setNotice(`「${selected?.name}」库存已调整，变更已记录到流水。`);
    setSelected(null);
    revalidator.revalidate();
  }
  return (
    <main className="inv-app" aria-labelledby="inv-title">
      <header className="inv-heading">
        <div>
          <div className="inv-eyebrow">履约中心</div>
          <h1 id="inv-title">库存管理</h1>
          <p>掌握仓库可用数量，及时处理低库存与盘点差异。</p>
        </div>
        <label className="inv-warehouse">
          <span>当前仓库</span>
          <select
            aria-label="当前仓库"
            value={stock.warehouse}
            onChange={event => warehouse(event.target.value)}
            disabled={busy}
          >
            {stock.warehouses.map(name => (
              <option key={name}>{name}</option>
            ))}
          </select>
        </label>
      </header>
      <div className="inv-metrics" aria-label="库存概览">
        <div className="inv-metric">
          <span>可用库存</span>
          <strong>
            {stock.summary.available.toLocaleString('zh-CN')}
            <small>件</small>
          </strong>
        </div>
        <div className="inv-metric">
          <span>已预留库存</span>
          <strong>
            {stock.summary.reserved.toLocaleString('zh-CN')}
            <small>件</small>
          </strong>
        </div>
        <div className="inv-metric">
          <span>低库存商品</span>
          <strong className={stock.summary.low ? 'inv-warning-number' : ''}>
            {stock.summary.low}
            <small>款</small>
          </strong>
        </div>
        <div className="inv-metric">
          <span>在库 SKU</span>
          <strong>
            {stock.summary.skus}
            <small>款</small>
          </strong>
        </div>
      </div>
      <section className="inv-panel" aria-label="仓库库存">
        <div className="inv-panel-heading">
          <h2>
            仓库库存 <span>{stock.warehouse}</span>
          </h2>
          <button
            className="inv-text-button"
            onClick={() => revalidator.revalidate()}
            disabled={busy}
          >
            {busy ? '刷新中…' : '刷新数据'}
          </button>
        </div>
        <div className="inv-filters">
          <label className="inv-search">
            <span className="inv-sr-only">搜索商品或 SKU</span>
            <input
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="搜索商品或 SKU"
            />
          </label>
          <label className="inv-checkbox">
            <input
              type="checkbox"
              checked={lowOnly}
              onChange={event => setLowOnly(event.target.checked)}
            />
            <span>仅看低库存</span>
            <b>{stock.summary.low}</b>
          </label>
          <span className="inv-result-count">{items.length} 条库存记录</span>
        </div>
        {notice && <output className="inv-notice">{notice}</output>}
        <div className="inv-table-wrap" aria-busy={busy}>
          <table className="inv-table">
            <thead>
              <tr>
                <th>商品 / SKU</th>
                <th>可用库存</th>
                <th className="inv-number">已预留</th>
                <th className="inv-number">预警阈值</th>
                <th>库存状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.sku}>
                  <td>
                    <div className="inv-product">
                      <span
                        className="inv-product-mark"
                        style={{ backgroundColor: item.color }}
                        aria-hidden="true"
                      >
                        {item.name.slice(0, 1)}
                      </span>
                      <span>
                        <strong>{item.name}</strong>
                        <small>{item.sku}</small>
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className="inv-stock-number">
                      <strong
                        className={
                          item.available < item.threshold
                            ? 'inv-warning-number'
                            : ''
                        }
                      >
                        {item.available}
                      </strong>
                      <div
                        className="inv-stock-track"
                        title={`可用 ${item.available} 件，预警阈值 ${item.threshold} 件`}
                      >
                        <i
                          style={{
                            width: `${Math.min(100, (item.available / (item.threshold * 4)) * 100)}%`,
                            backgroundColor:
                              item.available < item.threshold
                                ? '#d97706'
                                : '#38a896',
                          }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="inv-number inv-muted">{item.reserved}</td>
                  <td className="inv-number inv-muted">{item.threshold}</td>
                  <td>
                    {item.available < item.threshold ? (
                      <span className="inv-status inv-low">
                        <i />
                        需要补货
                      </span>
                    ) : (
                      <span className="inv-status inv-healthy">
                        <i />
                        库存充足
                      </span>
                    )}
                  </td>
                  <td>
                    <button
                      className="inv-text-button"
                      onClick={() => setSelected(item)}
                    >
                      调整库存
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {items.length === 0 && (
            <div className="inv-empty">
              <strong>没有匹配的库存记录</strong>
              <p>修改关键词或关闭低库存筛选后再试。</p>
              <button
                className="inv-button"
                onClick={() => {
                  setSearch('');
                  setLowOnly(false);
                }}
              >
                清空筛选
              </button>
            </div>
          )}
        </div>
        <footer className="inv-table-footer">
          <span>
            <i />
            可用库存低于预警阈值时，标记为需要补货。
          </span>
          <span>数据来自 {stock.warehouse}</span>
        </footer>
      </section>
      <section
        className="inv-panel inv-activity"
        aria-labelledby="inv-activity-title"
      >
        <div className="inv-panel-heading">
          <h2 id="inv-activity-title">最近库存流水</h2>
          <span className="inv-muted">各仓库最近 6 条变更</span>
        </div>
        <Suspense
          fallback={
            <div
              className="inv-activity-loading"
              data-testid="inventory-activity-loading"
              aria-busy="true"
            >
              <div />
              <div />
              <div />
              <span>正在读取库存流水…</span>
            </div>
          }
        >
          <Await
            resolve={activity}
            errorElement={
              <div className="inv-alert" role="alert">
                流水暂时无法加载。
                <button
                  className="inv-text-button"
                  onClick={() => revalidator.revalidate()}
                >
                  重新加载
                </button>
              </div>
            }
          >
            {(data: Movement[]) => <Activity movements={data} />}
          </Await>
        </Suspense>
      </section>
      {selected && (
        <Adjustment
          key={`${selected.sku}:${selected.warehouse}`}
          item={selected}
          onClose={() => setSelected(null)}
          onSaved={saved}
        />
      )}
    </main>
  );
}
