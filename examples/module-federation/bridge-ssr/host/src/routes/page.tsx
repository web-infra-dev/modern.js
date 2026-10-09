import { Link } from '@modern-js/runtime/router';
import {
  InventoryApplication,
  ProductApplication,
} from '../components/Applications';

export default function Dashboard() {
  return (
    <>
      <div className="workspace-heading">
        <div>
          <div className="workspace-eyebrow">运营工作台</div>
          <h1>今日经营，一目了然</h1>
          <p>管理商品、关注库存，让每一笔订单都有准备。</p>
        </div>
        <Link className="workspace-link" to="/products">
          进入商品管理 ↗
        </Link>
      </div>
      <div className="workspace-notice">
        <span className="notice-icon">i</span>
        <div>
          <b>秋季上新进行中</b>
          <span>及时检查商品状态与库存预警，保持各仓库供货充足。</span>
        </div>
      </div>
      <section className="application-section" aria-label="商品工作区">
        <ProductApplication />
      </section>
      <section className="application-section" aria-label="库存工作区">
        <InventoryApplication />
      </section>
    </>
  );
}
