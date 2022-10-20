import { useParams } from '@modern-js/runtime/runtime-router';

const Item = () => {
  const params = useParams();
  return <div className="item">{params.id}</div>;
};

export default Item;
