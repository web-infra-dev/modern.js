import React from 'react';
import { useToggle } from 'react-use';

export interface AppProps {
  client: string;
  dataSource: string;
  version: string;
}

const App: React.FC<AppProps> = ({ client, dataSource, version }) => {
  const [showDevtools, toggleDevtools] = useToggle(false);

  let query = '';
  query += `src=${encodeURIComponent(dataSource)}&`;
  query += `ver=${encodeURIComponent(version)}`;
  const src = `${client}?${query}`;

  return (
    <div>
      <div>
        <button onClick={toggleDevtools}>Toggle DevTools</button>
      </div>
      {showDevtools && <iframe src={src}></iframe>}
    </div>
  );
};

export default App;
