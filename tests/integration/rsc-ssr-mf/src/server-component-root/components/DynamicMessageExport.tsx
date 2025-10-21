'use client';
import React from 'react';

// Clean export for Module Federation
export const DynamicMessage = () => {
  const [message, setMessage] = React.useState('Hello from SSR Remote!');

  return (
    <div className="dynamic-message">
      <h3>Dynamic Message</h3>
      <p>{message}</p>
      <button onClick={() => setMessage('Message updated!')}>
        Update Message
      </button>
    </div>
  );
};

export default DynamicMessage;
