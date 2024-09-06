'use client';
import { useState } from 'react';
import Button from './Button';

export default function Counter(props) {
  const { count: initialCount } = props;

  const [count, setCount] = useState(initialCount);

  return (
    <div>
      Counter: {count}
      <Button onClick={() => setCount(count + 1)} />
    </div>
  );
}
