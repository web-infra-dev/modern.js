import { useNavigate } from '@modern-js/runtime/router';
import { Suspense } from 'react';
import About from './About';

export default function Page() {
  const nav = useNavigate();
  return (
    <div>
      hello user page
      <button
        onClick={() => {
          nav('/user/1');
        }}
      >
        go user/1
      </button>
      <Suspense fallback={<div>Loading About ...</div>}>
        <About />
      </Suspense>
    </div>
  );
}
