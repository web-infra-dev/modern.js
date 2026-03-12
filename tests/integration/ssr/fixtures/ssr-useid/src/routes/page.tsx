import { useId } from 'react';

const Page = () => {
  const singleId = useId();
  const items = ['a', 'b', 'c'];

  return (
    <div>
      <h1>React useId SSR Test</h1>
      <div data-testid="useid-single" id={singleId}>
        Single useId: {singleId}
      </div>
      <ul>
        {items.map(item => (
          <li key={item} data-testid={`useid-item-${item}`} id={useId()}>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Page;
