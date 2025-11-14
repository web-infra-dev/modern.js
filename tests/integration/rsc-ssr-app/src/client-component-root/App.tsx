'use client';
import 'client-only';
import {
  RuntimeContext,
  getRequest,
  redirect,
  setHeaders,
  setStatus,
  useRuntimeContext,
} from '@modern-js/runtime';
import './App.css';
import { use } from 'react';
import { Counter } from './components/Counter';

const handleResponse = (responseType: string) => {
  switch (responseType) {
    case 'headers':
      setHeaders({ 'x-test': 'test-value' });
      return { message: 'headers set' };

    case 'status':
      setStatus(418);
      return { message: 'status set' };

    case 'redirect':
      redirect('/server-component-root', 307);
      return null;

    case 'redirect-with-headers':
      redirect('/server-component-root', {
        status: 301,
        headers: {
          'x-redirect-test': 'test',
        },
      });
      return null;

    default:
      return { message: 'invalid type' };
  }
};

const App = () => {
  const context = use(RuntimeContext);
  const request = getRequest();
  const url = new URL(request.url);
  const responseType = url.searchParams.get('type');
  if (responseType) {
    handleResponse(responseType);
  }
  return (
    <>
      <div className="container">
        <main>
          <div className="user-agent">
            {typeof context.ssrContext?.request?.userAgent}
          </div>
          <div className="logo">
            <img
              src="https://lf3-static.bytednsdoc.com/obj/eden-cn/ylaelkeh7nuhfnuhf/modernjs-cover.png"
              width="300"
              alt="Modern.js Logo"
            />
          </div>
          <p className="description">
            Get started by editing <code className="code">src/App.tsx</code>
          </p>
          <div className="grid">
            <a href="https://modernjs.dev/docs/start" className="card">
              <h2>Quick Start</h2>
            </a>
            <a href="https://modernjs.dev/docs/guides" className="card">
              <h2>Handbook</h2>
            </a>
            <a href="https://modernjs.dev/docs/apis" className="card">
              <h2>API Reference </h2>
            </a>
          </div>
        </main>
        <footer className="footer">
          <a
            href="https://modernjs.dev"
            target="_blank"
            rel="noopener noreferrer"
          >
            Powered by Modern.js
          </a>
        </footer>
      </div>
      <Counter />
    </>
  );
};

export default App;
