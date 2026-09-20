// A directory entry backed by `.tsx`: `tsc` resolves `./foo` to this file, so
// the emitted specifier has to point at `foo/index.js`, not `foo.js`.
export const Badge = () => <span>badge</span>;

export const badgeName = 'foo-tsx';
