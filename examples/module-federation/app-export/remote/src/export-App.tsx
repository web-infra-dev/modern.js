import '@modern-js/runtime/registry/index'; // 这一行必须引入，它会默认导入微前端运行时依赖
import { render } from '@modern-js/runtime/browser';
import { createRoot } from '@modern-js/runtime/react';
import { createBridgeComponent } from '@module-federation/modern-js-v3/react-v19';
import type { ReactElement } from 'react';

const ModernRoot = createRoot();

export const provider = createBridgeComponent({
  // rootComponent 为你的应用的根组件，Edenx 应用使用从 createRoot 创建的 ModernRoot 即可
  rootComponent: ModernRoot,
  // render 函数为应用类型模块渲染函数，支持自定义，
  // Edenx 框架模式请使用 @edenx/runtime/browser 导出的 redner 函数，否则主子应用路由可能不能协同工作
  render: (Component, dom) =>
    render(Component as ReactElement<{ basename: string }>, dom),
});

export default provider;
