import { Link } from '@modern-js/runtime/router';
export default function ForecastError() {
  return (
    <section role="alert">
      <h2>This forecast could not be opened.</h2>
      <Link to="../">Return to the forecast</Link>
    </section>
  );
}
