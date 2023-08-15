import './DemoBlock.scss';

interface Props {
  title: string;
  children?: React.ReactNode;
}

export default (props: Props) => {
  const { title, children } = props;
  return (
    <div className="modern-demo-block">
      <div className="modern-demo-block-title">{title}</div>
      <div className="modern-demo-block-main">{children}</div>
    </div>
  );
};
