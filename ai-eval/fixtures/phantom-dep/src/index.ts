// 幽灵依赖样例：本文件 import 了 `lodash`，但 package.json 并未声明它。
// 期望 Agent 定位到该未声明依赖，并给出最小修复（补声明或移除使用），不手改 lockfile。
import { useState } from 'react';
import { capitalize } from 'lodash';

export function useTitle(initial: string) {
  const [title, setTitle] = useState(capitalize(initial));
  return { title, setTitle };
}
