import { useParams } from '@modern-js/runtime/router';

const Item = () => {
  const params = useParams();
  return <div className="item">{params.uid} uid exist</div>;
};

export default Item;
