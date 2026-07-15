// Shared L4 abstention heuristic (per bank meta: abstained is an independent
// field, does not affect accuracy). abstained=true when the answer explicitly
// declares the bundled/local docs don't cover the topic AND it doesn't
// fabricate a plugin-API name (api.xxx claims other than the allowed ones).
export function detectAbstention(text, allowedApiNames = []) {
  const declaresMissing =
    /(本地|捆绑|离线|bundle[d]?|local)[^\n]{0,20}(文档|docs?)[^\n]{0,30}(没有|未包含|不包含|未收录|查不到|缺失|找不到)|文档(里|中)没有|没有(找到|查到)相关文档|not\s+(found|covered|included|available)\s+in\s+(the\s+)?(local|bundled)\s+docs?|(local|bundled)\s+docs?\s+(do(es)?\s+not|don'?t)\s+(contain|cover|include)|需要(查阅|查询|参考)?线上文档|建议(查阅|查询)官方(线上)?文档/i.test(
      text,
    );
  if (!declaresMissing) return false;
  const claimed = [...text.matchAll(/\bapi\.(\w+)/g)].map(m => m[1]);
  const fabricated = claimed.some(name => !allowedApiNames.includes(name));
  return !fabricated;
}
