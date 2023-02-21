import { Suspense } from 'react';
import About from './About';

export default function Page() {
  return (
    <div>
      About page
      <Suspense fallback={<div>loading ...</div>}>
        <About />
      </Suspense>
    </div>
  );
}
