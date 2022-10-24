import { useParams } from '@modern-js/runtime/router';

export default () => {
  const params = useParams();
  return <div id="banana">banana: {params.id}</div>;
};
