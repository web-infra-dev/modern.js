export const ZH_LOCALE = {
  command: {
    change: {
      describe: '创建变更集',
      empty: '创建空变更集',
      open: '使用编辑器中打开创建的变更集',
      no_packages:
        '未找到子项目，请先执行 「{packageManager} new」 命令创建子项目',
    },
    bump: {
      describe: '使用变更集自动更新发布版本和变更日志',
      canary: '创建一个预发布版本进行测试',
      preid: '在对预发布版本进行版本控制时指定标识符',
      snapshot: '创建一个特殊版本进行测试',
      ignore: '跳过部分包发布版本',
    },
    pre: {
      describe: '进入和退出预发布模式',
    },
    release: {
      describe: '发布 npm 包',
      tag: '发布 npm 包使用特定的 tag',
      ignore_scripts:
        '发布时忽略 package.json 中的 scripts 命令，仅支持在 pnpm monorepo 中使用',
      no_git_checks:
        '发布命令忽略检查当前分支是否是发布分支，干净且最新，仅支持在 pnpm monorepo 中使用',
    },
  },
};
