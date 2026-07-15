// L5-01 (answer_keywords, version-trap): adding an entry in v3 — must state
// `modern new`/`pnpm new` is removed AND give the manual steps (create an
// entry directory + routes/ under src/). Recommending pnpm new = 0.
export default async function grade(ctx, c) {
  const a = ctx.answer();
  if (
    !c.add(
      'answer-present',
      !!a,
      a ? `source=${a.source}` : 'no ANSWER.md nor .final-answer.txt',
    )
  )
    return;
  const t = a.text;
  c.add(
    'states-new-removed',
    /(modern new|pnpm new|`?new`? ?命令)[^\n]{0,20}(已?移除|已被移除|不支持|不再|removed|no longer)/i.test(
      t,
    ) ||
      /(已?移除|removed)[^\n]{0,20}(modern new|pnpm new|`?new`? ?命令)/i.test(
        t,
      ),
    'expects an explicit statement that v3 removed `modern new`',
  );
  c.add(
    'manual-entry-steps',
    /src\/[^\s`'"]{0,30}/.test(t) &&
      /routes/.test(t) &&
      /(创建|新建|建立|create|mkdir|add(ing)?|建个?)/i.test(t),
    'expects manual steps: create an entry directory with routes/ under src/',
  );
  c.add(
    'no-new-recommendation',
    !ctx.recommendsWithoutNegation(
      t,
      /\b(modern|pnpm|npm run|yarn)\s+new\b/i,
      /(移除|不再|不能|不可|removed|no longer|deprecated|不要|别用|不支持)/i,
    ),
    'recommends removed `modern new` / `pnpm new` as usable',
  );
}
