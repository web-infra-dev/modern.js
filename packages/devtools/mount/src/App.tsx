import React from 'react';
import { useToggle } from 'react-use';
import { withQuery } from 'ufo';

export interface AppProps {
  client: string;
  dataSource: string;
  version: string;
}

const App: React.FC<AppProps> = ({ client, dataSource, version }) => {
  const [showDevtools, toggleDevtools] = useToggle(false);
  const src = withQuery(client, { src: dataSource, ver: version });

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
