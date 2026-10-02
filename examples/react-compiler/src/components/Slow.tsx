import { useRef } from 'react';

type Product = {
  id: number;
  name: string;
  category: string;
  price: number;
  score: number;
};

type ProductAnalyticsProps = {
  products: Product[];
};

const rankProducts = (products: Product[]) => {
  const startedAt = performance.now();
  const rows = products.map(product => {
    let heat = 0;

    for (let i = 0; i < 90_000; i++) {
      heat += Math.sqrt(product.score * i + product.price) % 11;
    }

    return {
      ...product,
      heat,
      priority: product.score * 12 + heat / 1000,
    };
  });

  return {
    rows: rows.sort((a, b) => b.priority - a.priority),
    cost: performance.now() - startedAt,
  };
};

export const ProductAnalytics = ({ products }: ProductAnalyticsProps) => {
  const renderCount = useRef(0);
  renderCount.current += 1;

  const { rows, cost } = rankProducts(products);
  const topProducts = rows.slice(0, 5);
  const averageScore =
    rows.reduce((total, product) => total + product.score, 0) / rows.length;

  return (
    <section className="analytics-panel" aria-label="Product analytics">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">expensive child tree</p>
          <h2>Product Analytics</h2>
        </div>
        <div className="render-meter">
          <span>{renderCount.current}</span>
          renders
        </div>
      </div>

      <div className="metrics">
        <div>
          <span>Render cost</span>
          <strong>{cost.toFixed(1)} ms</strong>
        </div>
        <div>
          <span>Average score</span>
          <strong>{averageScore.toFixed(1)}</strong>
        </div>
      </div>

      <div className="product-list">
        {topProducts.map(product => (
          <article className="product-row" key={product.id}>
            <div>
              <h3>{product.name}</h3>
              <p>{product.category}</p>
            </div>
            <strong>{product.priority.toFixed(0)}</strong>
          </article>
        ))}
      </div>
    </section>
  );
};
