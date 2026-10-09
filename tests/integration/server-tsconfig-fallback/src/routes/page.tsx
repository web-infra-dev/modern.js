import { greeting } from '@shared/greeting';

export default function Page() {
  return <h1 className="greeting">{greeting('page')}</h1>;
}
