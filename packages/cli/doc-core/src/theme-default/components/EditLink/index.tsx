import { useEditLink } from '../../logic';
import Edit from '../../assets/edit.svg';
import styles from './index.module.scss';

export default function EditLink() {
  const editLinkObj = useEditLink();

  if (!editLinkObj) {
    return null;
  }

  const { text } = editLinkObj;
  const realLink = `${editLinkObj.link}`;

  return (
    <a href={realLink} className={styles.editLink}>
      <span>
        <Edit
          style={{
            with: '18px',
            height: '18px',
            display: 'inline-block',
          }}
        />
      </span>
      {text}
    </a>
  );
}
