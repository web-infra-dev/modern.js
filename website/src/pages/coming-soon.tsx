import React from 'react';
import Layout from '@theme/Layout';
import styles from './coming-soon.module.css'

const Statement: React.FC = () => {
  return (
    <Layout description="The meta-framework suite designed from scratch for frontend-focused modern web development.">
      <div className={styles.container}>
        此内容在建设中，即将上线
        {/* <img className={styles.qrcode} src="/img/community-qrcode.png"/> */}
      </div>
    </Layout>
  )
};

export default Statement;
