export const ssgParams = () => [{ '*': 'guides/hello world' }];
export const loader = ({ params }: { params: { '*': string } }) => params['*'];
