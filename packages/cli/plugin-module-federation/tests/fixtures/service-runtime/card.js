import React from 'react';

export async function render() {
  const { default: Downstream } = await import('downstream/Card');
  return React.createElement(
    'section',
    null,
    'weather:',
    React.createElement(Downstream),
  );
}

export async function loadService() {
  return import('downstream/Service');
}
