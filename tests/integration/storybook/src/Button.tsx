import getMessage from '@api/lambda/message';
import { useState } from 'react';

export function Button({ buttonLabel }: { buttonLabel: string }) {
  const [message, setMessage] = useState('');
  return (
    <button onClick={async () => setMessage((await getMessage()).message)}>
      {buttonLabel} {message}
    </button>
  );
}
