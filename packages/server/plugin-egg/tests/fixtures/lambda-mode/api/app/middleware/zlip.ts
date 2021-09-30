async function zlip(ctx, next) {
  await next();

  ctx.body = 'hello';
}

export default zlip;
