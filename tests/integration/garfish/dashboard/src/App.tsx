import { Routes, Route, Link } from '@modern-js/runtime/router';
import './App.css';
// console.log(window.a.a.a)

const App = (props: { msg?: string; getHelloContext: any }) => {
  // console.log(props.getHelloContext());

  return (
    <div>
      <br />
      <div style={{ textAlign: 'center' }}>
        <Link to="/">home | </Link>
        <Link data-test="sub-link-dashboard" to="detail">
          detail |{' '}
        </Link>
        <Link data-test="sub-link-dashboard-throw-error" to="throw-error">
          throw-error
        </Link>
      </div>
      <Routes>
        <Route
          path="/*"
          element={
            <>
              <div style={{ textAlign: 'center' }}>Dashboard Home page</div>
              <div style={{ textAlign: 'center' }}>
                main app info: {props.msg}
              </div>
              <div className="container">
                <main>
                  <div className="logo">
                    <img
                      src="https://lf3-static.bytednsdoc.com/obj/eden-cn/ylaelkeh7nuhfnuhf/modernjs-cover.png"
                      width="300"
                      alt="Modern.js Logo"
                    />
                  </div>
                  <p className="description">
                    Get started by editing{' '}
                    <code className="code">src/App.tsx</code>
                  </p>
                </main>
              </div>
            </>
          }
        ></Route>
        <Route
          path="detail"
          element={
            <div style={{ textAlign: 'center' }}>Dashboard detail page</div>
          }
        ></Route>
        <Route path="throw-error" element={<div>throw Error</div>}></Route>
        <Route path="*" element={<div>404</div>}></Route>
      </Routes>
    </div>
  );
};

(App as any).config = {
  state: {
    hello: 'world',
  },
};

export default App;
