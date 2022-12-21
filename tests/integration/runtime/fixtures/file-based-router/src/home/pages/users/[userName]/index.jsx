import { useParams } from '@modern-js/runtime/router-v5';

export default () => {
  const params = useParams();
  return <div className="display">{params.userName}</div>;
};
