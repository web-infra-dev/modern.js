import './DemoBlock.scss';

interface Props {
  title: string;
  padding?: string;
  background?: string;
  children?: React.ReactNode;
}

export default (props: Props) => {
  const { title, padding = '12px 12px', background = '#fff', children } = props;
  return (
    <div className="demo-block">
      <div className="demo-block-title">{title}</div>
      <div
        className="demo-block-main"
        style={{
          padding,
          background,
        }}
      >
        {children}
      </div>
    </div>
  );
};
