import { useParams } from '@modern-js/runtime/router';

const Item = () => {
  const params = useParams();
  return <div className="item">bid detail {params.bid}</div>;
};

export default Item;
