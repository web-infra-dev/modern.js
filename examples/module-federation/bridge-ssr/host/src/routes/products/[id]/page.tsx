import { useParams } from '@modern-js/runtime/router';
import { ProductApplication } from '../../../components/Applications';
export default function ProductDetail() {
  const { id } = useParams();
  return (
    <section className="application-section standalone">
      <ProductApplication entryPath={`/${encodeURIComponent(id || '')}`} />
    </section>
  );
}
