export interface IPriviewProps {
  url: string;
}

export default (props: IPriviewProps) => {
  return (
    <iframe
      src={props.url}
      style={{ width: '375px', height: '600px' }}
    ></iframe>
  );
};
