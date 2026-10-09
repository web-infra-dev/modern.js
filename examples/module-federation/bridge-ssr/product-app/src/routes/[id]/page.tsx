import { Link, useLoaderData, useRevalidator } from '@modern-js/runtime/router';
import { useState } from 'react';
import {
  type Product,
  commerce,
  money,
  updatedAt,
} from '../../services/commerce';
import '../product.css';
export default function ProductDetail() {
  const product = useLoaderData() as Product;
  const revalidator = useRevalidator();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  async function toggle() {
    setPending(true);
    setError('');
    setMessage('');
    const status = product.status === 'on_sale' ? 'draft' : 'on_sale';
    try {
      await commerce(`products/${product.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      setMessage(`商品已${status === 'on_sale' ? '上架' : '下架'}`);
      revalidator.revalidate();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '更新失败，请重试');
    } finally {
      setPending(false);
    }
  }
  return (
    <main className="prd-app">
      <Link to=".." relative="path" className="prd-back">
        ← 返回商品列表
      </Link>
      <header className="prd-heading">
        <div>
          <div className="prd-eyebrow">商品档案 / {product.id}</div>
          <h1>{product.name}</h1>
          <p>查看商品基础信息，管理对外销售状态。</p>
        </div>
        <button
          className="prd-button prd-primary"
          disabled={pending}
          onClick={toggle}
        >
          {pending
            ? '更新中…'
            : product.status === 'on_sale'
              ? '下架商品'
              : '上架商品'}
        </button>
      </header>
      {message && <output className="prd-notice">{message}</output>}
      {error && (
        <div className="prd-alert" role="alert">
          {error}
        </div>
      )}
      <section className="prd-panel prd-detail">
        <div
          className="prd-detail-art"
          style={{ backgroundColor: product.color }}
        >
          <span>{product.category}</span>
          <strong>{product.name}</strong>
          <small>{product.id}</small>
        </div>
        <div className="prd-detail-info">
          <h2>基础信息</h2>
          <dl>
            <div>
              <dt>商品编号</dt>
              <dd>{product.id}</dd>
            </div>
            <div>
              <dt>商品名称</dt>
              <dd>{product.name}</dd>
            </div>
            <div>
              <dt>商品分类</dt>
              <dd>{product.category}</dd>
            </div>
            <div>
              <dt>商品售价</dt>
              <dd className="prd-detail-price">{money(product.price)}</dd>
            </div>
            <div>
              <dt>销售状态</dt>
              <dd>
                <span
                  className={`prd-status ${product.status === 'on_sale' ? 'prd-on-sale' : 'prd-draft'}`}
                >
                  <i />
                  {product.status === 'on_sale' ? '销售中' : '待上架'}
                </span>
              </dd>
            </div>
            <div>
              <dt>更新时间</dt>
              <dd>{updatedAt(product.updatedAt)}</dd>
            </div>
          </dl>
          <p className="prd-detail-note">
            下架后保留商品与库存记录，可随时重新上架。
          </p>
        </div>
      </section>
    </main>
  );
}
