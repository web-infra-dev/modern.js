import { useState } from 'react';

export interface InputCardProps {
  label: string;
  instance: string;
}

export default function InputCard({ label, instance }: InputCardProps) {
  const [count, setCount] = useState(0);
  return (
    <section data-testid={`input-${instance}`}>
      <h2>{label}</h2>
      <button
        data-testid={`input-${instance}-count`}
        onClick={() => setCount(value => value + 1)}
      >
        Readings: {count}
      </button>
    </section>
  );
}
