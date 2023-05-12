import { createWaterfall } from '@modern-js/plugin';
import { RouteProps } from 'react-router-dom';

const modifyRoutesHook = createWaterfall<RouteProps[]>();

export { modifyRoutesHook };
