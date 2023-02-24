import { INPUT_PARAMS_DECIDER } from '@modern-js/bff-core';
import { useContext } from '../../../../../../src/context';

const getMessage = () => {
  return 'hello';
};

const postMessage = (message: string, name: string) => {
  const ctx = useContext();
  return {
    message,
    name,
    method: ctx.req.method,
  };
};

Object.assign(getMessage, {
  [INPUT_PARAMS_DECIDER]: true,
});

Object.assign(postMessage, {
  [INPUT_PARAMS_DECIDER]: true,
});

export { getMessage, postMessage };
