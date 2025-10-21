import { useLoaderData, useParams } from '@modern-js/runtime/router';

export default function Product() {
  const params = useParams();
  const data = useLoaderData() as { productName: string; productId: string };

  return (
    <div className="product-page">
      <div className="product-id">product id: {params.id}</div>
      <div className="product-name">product name: {data?.productName}</div>
      <div className="product-data-id">data id: {data?.productId}</div>
    </div>
  );
}
