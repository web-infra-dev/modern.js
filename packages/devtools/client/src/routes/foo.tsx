import React from 'react';
import { useSnapshot } from 'valtio';
import { $config, $router } from '@/stores/router';

export const Foo: React.FC = () => {
  const router = useSnapshot($router);
  const config = useSnapshot($config);
  return (
    <div>
      <pre>{JSON.stringify(router.routes, null, 2)}</pre>
      <pre>{JSON.stringify(config.config, null, 2)}</pre>
    </div>
  );
};
