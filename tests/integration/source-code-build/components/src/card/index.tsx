import { strAdd } from '@source-code-build/utils';
import './index.less';

export interface CardProps {
  title: string;
  content?: string;
}

export const Card = (props: CardProps) => {
  const { title, content = '' } = props;
  return (
    <div className="card-comp">
      <h2>{title}</h2>
      <article>{strAdd('content is ', content)}</article>
    </div>
  );
};
