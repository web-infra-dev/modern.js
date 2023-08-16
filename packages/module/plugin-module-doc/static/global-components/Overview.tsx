import { Link } from '@modern-js/doc-core/theme';
import IconRight from './right.svg';
import styles from './Overview.module.scss';

type List = {
  icon?: React.ReactNode;
  text: string;
  link: string;
  arrow?: boolean;
};

const getGridClass = (count?: number): string => {
  if (!count) {
    return '';
  } else if (count % 3 === 0) {
    return 'grid-4';
  } else if (count % 2 === 0) {
    return 'grid-6';
  }
  return 'grid-6';
};

export default ({ list }: { list?: List[] }) => {
  const moduleList = list ?? [];
  const gridClass = getGridClass(moduleList.length);
  return (
    <div>
      <div className="overflow-hidden flex flex-wrap max-w-6xl">
        {moduleList.map(({ text, link, icon, arrow }) => {
          return (
            <div
              key={link + text}
              className={`${gridClass ? styles[gridClass] : 'w-full'} rounded `}
            >
              <div className="h-full p-2">
                <Link href={link}>
                  <span
                    key={link + text}
                    className={`${styles.featureCard} h-full p-3 flex items-center justify-between text-center`}
                  >
                    <span className="flex items-center gap-2">
                      {icon}
                      {text}
                    </span>
                    {arrow && <IconRight />}
                  </span>
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
