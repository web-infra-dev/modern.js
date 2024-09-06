'use client';

export default function Button(props) {
  const { onClick } = props;

  return <button onClick={onClick}>+1</button>;
}
