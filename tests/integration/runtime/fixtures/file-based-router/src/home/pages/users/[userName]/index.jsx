import { useParams } from '@modern-js/plugin-router-v5/runtime';

export default () => {
  const params = useParams();
  return <div className="display">{params.userName}</div>;
};
