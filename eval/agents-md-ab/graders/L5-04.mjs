// L5-04 (answer_keywords, version-trap): bundler config in v3 — must state
// webpack is no longer supported AND point to tools.rspack / tools.bundlerChain
// (Rspack-only). Recommending tools.webpack/webpackChain as usable = 0.
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
    'webpack-not-supported',
    /webpack[^\n]{0,30}(不支持|不再支持|已移除|不可用|no longer|not supported|removed|dropped)/i.test(
      t,
    ) ||
      /(不支持|不再支持|已移除|no longer support(s|ed)?)[^\n]{0,20}webpack/i.test(
        t,
      ),
    'expects an explicit statement that v3 no longer supports webpack (tools.webpack/webpackChain)',
  );
  c.add(
    'rspack-entry',
    ctx.positively(t, /tools\.rspack|tools\.bundlerChain/),
    'expects tools.rspack or tools.bundlerChain asserted positively as the v3 entry',
  );
  c.add(
    'no-webpack-recommendation',
    !ctx.recommendsWithoutNegation(
      t,
      /tools\.webpack|webpackChain/i,
      /(不支持|不再|已移除|不能|不可用|no longer|not supported|removed|不要|别用)/i,
    ),
    'recommends tools.webpack/webpackChain as usable = 0',
  );
}
