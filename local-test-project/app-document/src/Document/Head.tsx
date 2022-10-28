// import { useContext } from 'react';
// import { DocumentContext } from './DocumentContext';

export default function Document(props: { children?: any }) {
  // const data = useContext(DocumentContext);
  // console.log('===> data: ', data);
  // 校验 children 的合法性
  return <head>{props.children}</head>;
}
