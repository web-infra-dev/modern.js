import querystring from 'querystring';

// eslint-disable-next-line node/prefer-global/buffer
const bufferData = Buffer.from('xxxx');

const qsRes = querystring.stringify({
  foo: 'bar',
});

function App() {
  return (
    <div>
      <div id="test-buffer">{bufferData}</div>
      <div id="test-querystring">{qsRes}</div>
      <div id="test">Hello Builder!</div>
    </div>
  );
}

export default App;
