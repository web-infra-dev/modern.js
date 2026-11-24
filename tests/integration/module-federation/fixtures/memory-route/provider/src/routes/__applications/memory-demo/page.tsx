import { Link } from '@modern-js/runtime/router';

export default function MemoryDemoHome() {
  return (
    <section data-testid="memory-demo-home">
      <h2>Memory Home</h2>
      <Link
        data-testid="memory-demo-to-55"
        to="detail/55?tab=from-home&probe=from-home"
      >
        Station 55
      </Link>
    </section>
  );
}
