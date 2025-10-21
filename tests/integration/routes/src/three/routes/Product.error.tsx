import { useRouteError } from '@modern-js/runtime/router';

export default function ProductError() {
  const error = useRouteError() as Error;

  return (
    <div className="product-error">
      <div className="error-title">Product Error Boundary</div>
      <div className="error-message">{error?.message}</div>
    </div>
  );
}
