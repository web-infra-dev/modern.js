import 'server-only';
import { Suspense } from 'react';
import { Message } from './Message';

const fetchData = async (): Promise<string> => {
  return new Promise(resolve =>
    setTimeout(() => resolve('root page from server'), 100),
  );
};

export default function Page() {
  const dataPromise = fetchData();
  return (
    <Suspense fallback={<p>waiting for message...</p>}>
      <div className="root-page">
        <Message messagePromise={dataPromise} />
      </div>
    </Suspense>
  );
}
