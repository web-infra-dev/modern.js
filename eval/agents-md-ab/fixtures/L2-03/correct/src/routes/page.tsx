import './index.css';
import styles from './button.module.css';

// 如果想让 src/styles/legacy.css 这类不带 .module 后缀的文件也按 CSS Modules 处理，
// 应配置 output.cssModules（auto 选项）——参见 configure/app/output/css-modules。
const Index = () => (
  <div className="container-box">
    <main>
      <button type="button" className={styles.redButton}>
        Red Button
      </button>
    </main>
  </div>
);

export default Index;
