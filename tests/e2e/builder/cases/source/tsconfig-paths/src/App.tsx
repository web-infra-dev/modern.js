import { content } from '@/common/test';

const testAliasEl = document.createElement('div');
testAliasEl.id = 'foo';
testAliasEl.innerHTML = content;
document.body.appendChild(testAliasEl);

const App = () => <div id="test">Hello Builder!</div>;

export default App;
