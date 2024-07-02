import { useModel } from '@modern-js/runtime/model';
import countModel from '../models/count';

const Page = () => {
  const [state, actions] = useModel(countModel);

  return (
    <div>
      <div>counter: {state.value}</div>
      <button onClick={() => actions.add()}>add</button>
    </div>
  );
};

export default Page;
