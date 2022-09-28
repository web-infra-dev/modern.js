import { useParams } from '@modern-js/runtime/router';

export default () => {
  const { userName } = useParams();
  return <div className="display">{userName}</div>;
};
