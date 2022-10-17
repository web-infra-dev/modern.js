// share script
export const HEAD_REG_EXP = /<head(.|\n)*>(.|\n)*<\/head>/;
export type BuildTemplateCb = (headTemplate: string) => string;
export function buildTemplate(template: string, callbacks: BuildTemplateCb[]) {
  return callbacks.reduce(
    (template, buildTemplateCb) => buildTemplateCb(template),
    template,
  );
}
