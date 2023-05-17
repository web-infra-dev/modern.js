import meta from 'virtual-meta';
import { createElement } from 'react';
import { useParams } from 'react-router-dom';

// 渲染出 Demo 组件
export function Demo() {
  // 获取路由参数
  const { id } = useParams();
  // 根据 id 获取 Demo 组件
  const result = meta.demos.find(item => item.id === id);
  if (result) {
    return createElement(result.component);
  } else {
    return null;
  }
}
