const Layout = ({ Component, ...pageProps }) => {
  return (
    <>
      <div>current name is: </div>
      <Component {...pageProps} />
    </>
  );
};
export default Layout;
