import { ProductAnalytics } from '@/components/Slow';
import { useState } from 'react';

const products = [
  { id: 1, name: 'Atlas Chair', category: 'Office', price: 189, score: 92 },
  { id: 2, name: 'Signal Lamp', category: 'Lighting', price: 76, score: 85 },
  { id: 3, name: 'Arc Desk', category: 'Office', price: 420, score: 88 },
  { id: 4, name: 'Grid Shelf', category: 'Storage', price: 139, score: 78 },
  { id: 5, name: 'Nova Speaker', category: 'Audio', price: 249, score: 91 },
  { id: 6, name: 'Pulse Stand', category: 'Accessories', price: 58, score: 80 },
  { id: 7, name: 'Mica Mug', category: 'Kitchen', price: 24, score: 74 },
  { id: 8, name: 'Core Bag', category: 'Travel', price: 118, score: 83 },
];

const Index = () => {
  const [counter, setCounter] = useState(0);
  const [highlighted, setHighlighted] = useState(false);

  return (
    <main className={highlighted ? 'app is-highlighted' : 'app'}>
      <section className="intro">
        <p className="eyebrow">Modern.js + React 19</p>
        <h1>React Compiler render bailout</h1>
        <p>
          点击下面的按钮只会更新父组件状态。右侧分析面板没有使用
          <code>memo</code>、<code>useMemo</code> 或 <code>useCallback</code>。
          React Compiler 会自动缓存这棵 JSX 子树，所以它的 render
          次数应该保持不变。
        </p>
      </section>

      <section className="demo-grid">
        <div className="control-panel">
          <div>
            <p className="eyebrow">parent state</p>
            <h2>Dashboard Controls</h2>
          </div>

          <div className="counter-card">
            <span>Parent counter</span>
            <strong>{counter}</strong>
          </div>

          <div className="actions">
            <button
              type="button"
              onClick={() => setCounter(count => count + 1)}
            >
              Update parent
            </button>
            <button
              className="secondary"
              type="button"
              onClick={() => setHighlighted(value => !value)}
            >
              Toggle theme
            </button>
          </div>

          <p className="hint">
            如果关闭 React Compiler，每次点击都会重新运行右侧昂贵计算，render
            次数也会持续增加。
          </p>
        </div>

        <ProductAnalytics products={products} />
      </section>
    </main>
  );
};

export default Index;
