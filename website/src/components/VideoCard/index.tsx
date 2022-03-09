import React from 'react';
import styles from './index.module.css';

export interface VideoCardProps {
  title: string;
  desc: string;
  videoUrl?: string;
  detailUrl: string;
  direction?: 'left' | 'right';
  imgUrl?: string;
}

const VideoCard: React.FC<VideoCardProps> = ({
  title,
  direction = 'left',
  detailUrl,
  imgUrl,
}) => {
  if (direction === 'left') {
    return (
      <div className={`${styles.card} ${styles.left}`}>
        <div className={`${styles.descWrap}`}>
          <div className={styles.title}>{title}</div>
          <a href={detailUrl} className={styles.seeDetails}>
            查看详情
            <img
              src="https://lf3-static.bytednsdoc.com/obj/eden-cn/aphqeh7uhohpquloj/modern-js/right-arrow-color.svg"
              width="20"
              height="20"
              className={styles.rightArrow}
            />
          </a>
        </div>
        <img className={styles.videoWrap} src={imgUrl} alt="" />
      </div>
    );
  } else {
    return (
      <div className={`${styles.card} ${styles.right}`}>
        <div className={`${styles.descWrap}`}>
          <div className={styles.title}>{title}</div>
          <a href={detailUrl} className={styles.seeDetails}>
            查看详情
            <img
              src="https://lf3-static.bytednsdoc.com/obj/eden-cn/aphqeh7uhohpquloj/modern-js/right-arrow-color.svg"
              width="20"
              height="20"
              className={styles.rightArrow}
            />
          </a>
        </div>
        <img className={styles.videoWrap} src={imgUrl} alt="" />
      </div>
    );
  }
};

export default VideoCard;
