import React from 'react';

const Page: React.FC = () => (
  <div>
    <h3>约定式路由</h3>
    <p>
      以 routes/ 为约定的入口，EdenX 会自动基于文件系统，生成对应的路由结构。
    </p>
    <p>
      EdenX 支持了业界流行的约定式路由模式：嵌套路由，使用嵌套路由时，页面的路由
      与 UI 结构是相呼应的，我们将会详细介绍这种路由模式。
    </p>
  </div>
);

export default Page;
