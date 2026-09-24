import {
  Await,
  Link,
  useLoaderData,
  useLocation,
  useNavigate,
  useNavigation,
  useRevalidator,
} from '@modern-js/runtime/router';
import { type FormEvent, Suspense, useState } from 'react';
import {
  type Product,
  type ProductData,
  type ProductSummary,
  commerce,
  money,
  updatedAt,
} from '../services/commerce';
import './product.css';

function Summary({ summary }: { summary: ProductSummary }) {
  return (
    <div
      className="prd-metrics"
      aria-label="商品概览"
      data-testid="product-summary"
    >
      {[
        ['全部商品', summary.total],
        ['销售中', summary.onSale],
        ['待上架', summary.draft],
        ['平均售价', money(summary.averagePrice)],
      ].map(([label, value]) => (
        <div key={label} className="prd-metric">
          <span>{label}</span>
          <strong>{value}</strong>
        </div>
      ))}
    </div>
  );
}
function SummaryLoading() {
  return (
    <div
      className="prd-metrics"
      aria-busy="true"
      data-testid="product-summary-loading"
    >
      {['全部商品', '销售中', '待上架', '平均售价'].map(label => (
        <div className="prd-metric" key={label}>
          <span>{label}</span>
          <strong className="prd-placeholder">—</strong>
        </div>
      ))}
    </div>
  );
}
export default function ProductPage() {
  const { list, filters, summary } = useLoaderData() as ProductData;
  const location = useLocation();
  const navigate = useNavigate();
  const navigation = useNavigation();
  const revalidator = useRevalidator();
  const [pending, setPending] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const busy = navigation.state !== 'idle' || revalidator.state !== 'idle';
  const pages = Math.max(1, Math.ceil(list.total / list.pageSize));
  function changeSearch(values: Record<string, string>) {
    const query = new URLSearchParams(location.search);
    for (const [key, value] of Object.entries(values))
      value ? query.set(key, value) : query.delete(key);
    navigate({ search: query.toString() ? `?${query}` : '' });
  }
  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    changeSearch({
      q: String(form.get('q') || '').trim(),
      category: String(form.get('category') || ''),
      status: String(form.get('status') || ''),
      page: '1',
    });
  }
  async function toggle(product: Product) {
    setPending(product.id);
    setError('');
    setNotice('');
    const status = product.status === 'on_sale' ? 'draft' : 'on_sale';
    try {
      await commerce(`products/${product.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      setNotice(
        `「${product.name}」已${status === 'on_sale' ? '上架' : '下架'}`,
      );
      revalidator.revalidate();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '更新失败，请重试');
    } finally {
      setPending(null);
    }
  }
  return (
    <main className="prd-app" aria-labelledby="prd-title">
      <header className="prd-heading">
        <div>
          <div className="prd-eyebrow">商品中心</div>
          <h1 id="prd-title">商品管理</h1>
          <p>维护商品信息与销售状态，让每一件好物井然有序。</p>
        </div>
        <button
          className="prd-button"
          onClick={() => revalidator.revalidate()}
          disabled={busy}
        >
          {busy ? '刷新中…' : '刷新数据'}
        </button>
      </header>
      <Suspense fallback={<SummaryLoading />}>
        <Await
          resolve={summary}
          errorElement={
            <div className="prd-alert" role="alert">
              统计暂时不可用。
              <button onClick={() => revalidator.revalidate()}>重新加载</button>
            </div>
          }
        >
          {(data: ProductSummary) => <Summary summary={data} />}
        </Await>
      </Suspense>
      <section className="prd-panel" aria-label="商品列表">
        <div className="prd-panel-heading">
          <h2>
            全部商品 <span>{list.total}</span>
          </h2>
          <span className="prd-muted">按商品编号排列</span>
        </div>
        <form
          className="prd-filters"
          key={`${filters.q}|${filters.category}|${filters.status}`}
          onSubmit={search}
        >
          <label className="prd-search">
            <span>商品名称</span>
            <input
              name="q"
              defaultValue={filters.q}
              placeholder="搜索商品名称"
              autoComplete="off"
            />
          </label>
          <label>
            <span>商品分类</span>
            <select name="category" defaultValue={filters.category}>
              <option value="">全部分类</option>
              {list.categories.map(category => (
                <option key={category}>{category}</option>
              ))}
            </select>
          </label>
          <label>
            <span>销售状态</span>
            <select name="status" defaultValue={filters.status}>
              <option value="">全部状态</option>
              <option value="on_sale">销售中</option>
              <option value="draft">待上架</option>
            </select>
          </label>
          <div className="prd-filter-actions">
            <button
              className="prd-button prd-primary"
              type="submit"
              disabled={busy}
            >
              查询
            </button>
            <button
              className="prd-button"
              type="button"
              onClick={() =>
                changeSearch({ q: '', category: '', status: '', page: '1' })
              }
            >
              重置
            </button>
          </div>
        </form>
        {notice && <output className="prd-notice">{notice}</output>}
        {error && (
          <div className="prd-alert" role="alert">
            {error}
          </div>
        )}
        <div className="prd-table-wrap" aria-busy={busy}>
          <table className="prd-table">
            <thead>
              <tr>
                <th>商品</th>
                <th>分类</th>
                <th className="prd-number">售价</th>
                <th>销售状态</th>
                <th>更新时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {list.items.map(product => (
                <tr key={product.id}>
                  <td>
                    <Link to={product.id} className="prd-product">
                      <span
                        className="prd-swatch"
                        style={{ backgroundColor: product.color }}
                        aria-hidden="true"
                      >
                        {product.category === '户外生活'
                          ? '野'
                          : product.category === '生活器具'
                            ? '物'
                            : '居'}
                      </span>
                      <span>
                        <strong>{product.name}</strong>
                        <small>{product.id}</small>
                      </span>
                    </Link>
                  </td>
                  <td>{product.category}</td>
                  <td className="prd-number prd-price">
                    {money(product.price)}
                  </td>
                  <td>
                    <span
                      className={`prd-status ${product.status === 'on_sale' ? 'prd-on-sale' : 'prd-draft'}`}
                    >
                      <i />
                      {product.status === 'on_sale' ? '销售中' : '待上架'}
                    </span>
                  </td>
                  <td className="prd-time">{updatedAt(product.updatedAt)}</td>
                  <td>
                    <div className="prd-row-actions">
                      <Link to={product.id}>详情</Link>
                      <button
                        disabled={pending !== null}
                        onClick={() => toggle(product)}
                      >
                        {pending === product.id
                          ? '更新中…'
                          : product.status === 'on_sale'
                            ? '下架'
                            : '上架'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {list.items.length === 0 && (
            <div className="prd-empty">
              <strong>没有找到匹配的商品</strong>
              <p>试试其他关键词，或清空筛选条件。</p>
              <button
                className="prd-button"
                onClick={() =>
                  changeSearch({ q: '', category: '', status: '', page: '1' })
                }
              >
                清空筛选
              </button>
            </div>
          )}
        </div>
        <footer className="prd-pagination">
          <span>
            共 {list.total} 件商品，每页 {list.pageSize} 件
          </span>
          <div>
            <button
              className="prd-button"
              disabled={list.page <= 1 || busy}
              onClick={() => changeSearch({ page: String(list.page - 1) })}
            >
              上一页
            </button>
            <span className="prd-page-number">
              {list.page} / {pages}
            </span>
            <button
              className="prd-button"
              disabled={list.page >= pages || busy}
              onClick={() => changeSearch({ page: String(list.page + 1) })}
            >
              下一页
            </button>
          </div>
        </footer>
      </section>
    </main>
  );
}
