type Sign = { status: number };

const fn = (sign: Sign) => {
  sign.status += 1;
};

export default ({
  addMiddleware,
  beforeMatch,
  beforeRender,
  afterMatch,
  afterRender,
}: any) => {
  addMiddleware(fn);

  beforeMatch(fn);

  beforeRender(fn);

  afterMatch(fn);

  afterRender(fn);
};
