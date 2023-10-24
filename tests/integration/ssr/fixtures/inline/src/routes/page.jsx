import './index.css';

const Index = (): JSX.Element => (
  <div className="container-box">
    <main>
      <div className="title">
        Welcome to
        <img
          className="logo"
          src="https://lf3-static.bytednsdoc.com/obj/eden-cn/nuvshpqnulg/eden-x-logo.png"
          alt="EdenX Logo"
        />
        <p className="name">EdenX</p>
      </div>
      <p className="description">
        Get started by editing <code className="code">src/routes/page.tsx</code>
      </p>
      <div className="grid">
        <a
          href="https://modernjs.dev/guides/get-started/quick-start.html"
          target="_blank"
          rel="noopener noreferrer"
          className="card"
        >
          <h2>
            Guide
            <img
              className="arrow-right"
              src="https://lf3-static.bytednsdoc.com/obj/eden-cn/zq-uylkvT/ljhwZthlaukjlkulzlp/arrow-right.svg"
            />
          </h2>
          <p>Follow the guides to use all features of EdenX.</p>
        </a>
        <a
          href="https://modernjs.dev/tutorials/foundations/introduction"
          target="_blank"
          className="card"
          rel="noreferrer"
        >
          <h2>
            Tutorials
            <img
              className="arrow-right"
              src="https://lf3-static.bytednsdoc.com/obj/eden-cn/zq-uylkvT/ljhwZthlaukjlkulzlp/arrow-right.svg"
            />
          </h2>
          <p>Learn to use EdenX to create your first application.</p>
        </a>
        <a
          href="https://modernjs.dev/configure/app/usage"
          target="_blank"
          className="card"
          rel="noreferrer"
        >
          <h2>
            Config
            <img
              className="arrow-right"
              src="https://lf3-static.bytednsdoc.com/obj/eden-cn/zq-uylkvT/ljhwZthlaukjlkulzlp/arrow-right.svg"
            />
          </h2>
          <p>Find all configuration items provided by EdenX.</p>
        </a>
        <a
          href="https://code.byted.org/webinfra/edenx"
          target="_blank"
          rel="noopener noreferrer"
          className="card"
        >
          <h2>
            GitLab
            <img
              className="arrow-right"
              src="https://lf3-static.bytednsdoc.com/obj/eden-cn/zq-uylkvT/ljhwZthlaukjlkulzlp/arrow-right.svg"
            />
          </h2>
          <p>View the source code of EdenX, feel free to contribute.</p>
        </a>
      </div>
    </main>
  </div>
);

export default Index;
