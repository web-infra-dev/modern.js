import { demos } from 'virtual-meta';
import { createElement } from 'react';
import { useLocation } from '@modern-js/doc-core/runtime';

// 渲染出 Demo 组件
export default function Demo() {
  // 获取路由参数
  const { pathname } = useLocation();
  // Get the id from the pathname
  const id = pathname.split('/').pop();
  // console.log(params, demos);
  // 根据 id 获取 Demo 组件
  const result = demos.flat().find(item => item.id === id);
  if (result) {
    return createElement(result.component);
  } else {
    return null;
  }
}
