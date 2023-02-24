import { useParams } from '@modern-js/runtime/router';

const Item = () => {
  const params = useParams();
  return <div className="item">{params.bid} bid exist</div>;
};

export default Item;
