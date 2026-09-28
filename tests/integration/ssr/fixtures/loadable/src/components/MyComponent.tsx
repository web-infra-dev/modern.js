import React, { useState } from 'react';

const MyComponent = () => {
  const [count, setCount] = useState(0);

  return (
    <div>
      <div>Hello, Loadable Component!</div>
      <button
        id="loadable-hydration-button"
        type="button"
        onClick={() => setCount(value => value + 1)}
      >
        Hydration count: {count}
      </button>
    </div>
  );
};

export default MyComponent;
