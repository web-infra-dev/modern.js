'use server-entry';
import 'server-only';
import { getRequest, redirect, setHeaders } from '@modern-js/runtime';
import { setStatus } from '@modern-js/runtime';
import { Suspense } from 'react';
import styles from './App.module.less';
import Suspended from './Suspended';
import { Counter } from './components/Counter';
import { getCountState } from './components/ServerState';

const handleResponse = (responseType: string) => {
  switch (responseType) {
    case 'headers':
      setHeaders({ 'x-test': 'test-value' });
      return { message: 'headers set' };

    case 'status':
      setStatus(418);
      return { message: 'status set' };

    case 'redirect':
      redirect('/client-component-root', 307);
      return null;

    case 'redirect-with-headers':
      redirect('/client-component-root', {
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

const App = ({ name }: { name: string }) => {
  const request = getRequest();
  const url = new URL(request.url);
  const responseType = url.searchParams.get('type');
  if (responseType) {
    handleResponse(responseType);
  }

  const countStateFromServer = getCountState();
  return (
    <div className={styles.root}>
      <h1 data-testid="app-name">{name}</h1>
      <Suspense fallback={<div>Loading...</div>}>
        <Suspended />
      </Suspense>
      <Counter />
      <div>countStateFromServer: {countStateFromServer}</div>
    </div>
  );
};

export default App;
