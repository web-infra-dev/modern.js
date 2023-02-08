const UserLayout = ({ children }: { children: any }) => {
  return (
    <div className="global-layout">
      global layout
      {children}
    </div>
  );
};

const App = ({ Component }: { Component: any }) => {
  return (
    <UserLayout>
      <Component />
    </UserLayout>
  );
};

export default App;
