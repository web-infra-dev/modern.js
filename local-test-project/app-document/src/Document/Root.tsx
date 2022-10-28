export default function Root(
  props: { children?: any; rootId?: string } = { rootId: 'root' },
) {
  // a. 从 Doucment.provider 来获取 rootId
  // b. 从 options.获取
  // console.log('++> : ', props);
  return <div id={`${props.rootId}`}>{props.children}</div>;
}
