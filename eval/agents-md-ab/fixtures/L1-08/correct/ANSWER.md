因为只有以 MODERN_ 前缀命名的环境变量才会被注入前端代码，MY_FLAG 没有该前缀所以是 undefined。把变量改名为 MODERN_MY_FLAG 即可在组件里通过 process.env.MODERN_MY_FLAG 读取。（REACT_APP_ 是 CRA 的约定，不适用于 Modern.js；也可用 source.globalVars 作为补充方案。）
