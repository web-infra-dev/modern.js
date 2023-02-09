import React from 'react';

const UserLayout = ({ children }: { children: React.ReactNode }) => {
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
