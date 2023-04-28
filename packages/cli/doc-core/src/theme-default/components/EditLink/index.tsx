import { useEditLink } from '../../logic';
import Edit from '../../assets/edit.svg';
import styles from './index.module.scss';

interface EditLinkProps {
  editLink: {
    repoUrl: string;
    pattern: string;
    text: string;
  };
  relativePagePath: string;
}

export default function EditLink({
  editLink,
  relativePagePath,
}: EditLinkProps) {
  const editLinkObj = useEditLink(editLink, relativePagePath);

  if (!editLinkObj) {
    return null;
  }

  const { text } = editLinkObj;
  const repoUrl = `${editLink.repoUrl}${window.location.pathname}`;

  return (
    <a href={repoUrl} className={styles.editLink}>
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
      <span className={styles.rightSymbol}>&gt;</span>
    </a>
  );
}
