(1) 使用 api.wrapRoot 方法包裹应用根组件（Runtime Plugin 的 setup(api) 中调用）。
(2) 文档特别强调：包装组件必须把 props 透传给原来的根组件（{...props}），否则应用可能无法正常工作。
