import { useLoader } from '@modern-js/runtime';

export default () => {
  const { data } = useLoader(async () => {
    return 'Hello-Edenx';
  });

  return <div>{data}</div>;
};
