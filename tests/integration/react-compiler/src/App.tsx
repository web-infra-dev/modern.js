import { useState } from 'react';

let staticChildRenderCount = 0;

// StaticChild intentionally mutates a module-level variable so React Compiler
// bails out on it; the assertions target the parent's compiler-memoized
// `<StaticChild />` element instead.
function StaticChild() {
  staticChildRenderCount += 1;
  return <span data-testid="child-render-count">{staticChildRenderCount}</span>;
}

const App = () => {
  const [count, setCount] = useState(0);
  return (
    <div>
      <button
        type="button"
        data-testid="increment"
        onClick={() => setCount(count + 1)}
      >
        increment
      </button>
      <span data-testid="count">{count}</span>
      <StaticChild />
    </div>
  );
};

export default App;
