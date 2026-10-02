import './index.css';
import { useEffect, useState } from 'react';

const Index = () => {
  const [messages, setMessages] = useState<string[]>([]);
  const [status, setStatus] = useState<'connecting' | 'open' | 'closed'>(
    'connecting',
  );

  useEffect(() => {
    const eventSource = new EventSource('/sse');

    eventSource.onopen = () => {
      setStatus('open');
    };

    eventSource.addEventListener('time-update', event => {
      setMessages(prev => [event.data, ...prev].slice(0, 5));
    });

    eventSource.onerror = error => {
      console.error('EventSource failed:', error);
      setStatus('closed');
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, []);

  return (
    <main>
      <h1>Modern.js SSE Demo</h1>
      <p>Connection: {status}</p>
      <ul>
        {messages.map(message => (
          <li key={message}>{message}</li>
        ))}
      </ul>
    </main>
  );
};

export default Index;
