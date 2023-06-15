import svgImg from './app.svg?url';
import './App.css';

function App() {
  return (
    <div>
      <div id="test">Hello Builder!</div>
      <img id="test-img" src={svgImg} />
      <div id="test-css" />
    </div>
  );
}

export default App;
