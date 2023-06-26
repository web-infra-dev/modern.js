import { useEditLink } from '../../logic';
import Edit from '../../assets/edit.svg';
import styles from './index.module.scss';

export default function EditLink() {
  const editLinkObj = useEditLink();

  if (!editLinkObj) {
    return null;
  }

  const { text, link } = editLinkObj;

  return (
    <a href={link} target="_blank" className={styles.editLink}>
      <Edit
        className="h-5.5 mr-2 inline-block"
        style={{ verticalAlign: '-5px' }}
      />
      {text}
    </a>
  );
}
