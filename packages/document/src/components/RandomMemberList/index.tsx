import { NoSSR } from '@rspress/core/runtime';
import style from './index.module.scss';

interface Member {
  id: string;
  avatar: string;
  // The display name, if not set, use id instead
  name?: string;
}

const MEMBERS: Member[] = [
  {
    id: '10Derozan',
    avatar: 'https://avatars.githubusercontent.com/u/50694858?s=120&v=4',
  },
  {
    id: '2heal1',
    avatar: 'https://avatars.githubusercontent.com/u/41466093?s=120&v=4',
  },
  {
    id: '9aoy',
    avatar: 'https://avatars.githubusercontent.com/u/22373761?s=120&v=4',
  },
  {
    id: 'Asuka109',
    avatar: 'https://avatars.githubusercontent.com/u/18379948?s=120&v=4',
  },
  {
    id: 'caohuilin',
    avatar: 'https://avatars.githubusercontent.com/u/12605189?s=120&v=4',
  },
  {
    id: 'chenjiahan',
    avatar: 'https://avatars.githubusercontent.com/u/7237365?s=120&v=4',
  },
  {
    id: 'clChenLiang',
    avatar: 'https://avatars.githubusercontent.com/u/13596193?s=120&v=4',
  },
  {
    id: 'danpeen',
    avatar: 'https://avatars.githubusercontent.com/u/18045417?s=120&v=4',
  },
  {
    id: 'GiveMe-A-Name',
    avatar: 'https://avatars.githubusercontent.com/u/58852732?s=120&v=4',
  },
  {
    id: 'jkzing',
    avatar: 'https://avatars.githubusercontent.com/u/2851517?s=120&v=4',
  },
  {
    id: 'JSerFeng',
    avatar: 'https://avatars.githubusercontent.com/u/57202839?s=120&v=4',
  },
  {
    id: 'KyrieLii',
    avatar: 'https://avatars.githubusercontent.com/u/16858738?s=120&v=4',
  },
  {
    id: 'nyqykk',
    avatar: 'https://avatars.githubusercontent.com/u/65393845?s=120&v=4',
  },
  {
    id: 'sanyuan0704',
    avatar: 'https://avatars.githubusercontent.com/u/39261479?s=120&v=4',
  },
  {
    id: 'targeral',
    avatar: 'https://avatars.githubusercontent.com/u/9037723?s=120&v=4',
  },
  {
    id: 'xuchaobei',
    avatar: 'https://avatars.githubusercontent.com/u/5110783?s=120&v=4',
  },
  {
    id: 'xyoscer',
    avatar: 'https://avatars.githubusercontent.com/u/16360717?s=120&v=4',
  },
  {
    id: 'yimingjfe',
    avatar: 'https://avatars.githubusercontent.com/u/10381581?s=120&v=4',
  },
  {
    id: 'zhoushaw',
    avatar: 'https://avatars.githubusercontent.com/u/27547179?s=120&v=4',
  },
  {
    id: 'zllkjc',
    avatar: 'https://avatars.githubusercontent.com/u/68810266?s=120&v=4',
  },
  {
    id: 'zoolsher',
    avatar: 'https://avatars.githubusercontent.com/u/9161085?s=120&v=4',
  },
];

export const RandomMemberList = () => {
  const randomList = MEMBERS.sort(() => Math.random() - 0.5);

  return (
    <NoSSR>
      <div className={style.wrapper}>
        {randomList.map(item => (
          <a
            className={style.link}
            href={`https://github.com/${item.id}`}
            target="_blank"
            rel="nofollow"
            key={item.id}
            style={{
              border: 'none',
            }}
          >
            <img className={style.avatar} src={item.avatar} />
            <span className={style.name}>{item.name || item.id}</span>
          </a>
        ))}
      </div>
    </NoSSR>
  );
};
