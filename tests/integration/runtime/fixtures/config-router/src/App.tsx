const App = ({ Component }: any) => {
  const params = {
    say: 'I like',
  };
  return <Component {...params} />;
};

// const App = () => <div>123</div>;

export default App;
