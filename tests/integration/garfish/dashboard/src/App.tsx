import './App.css';
// console.log(window.a.a.a)

const App = () => {
  // console.log(props.getHelloContext());

  return <div>111</div>;
};

(App as any).config = {
  state: {
    hello: 'world',
  },
};

export default App;
