import { merge } from 'lodash';

const test = merge({}, { a: 1 }, { b: 2 });

const App = () => <div>{JSON.stringify(test)}</div>;

export default App;
