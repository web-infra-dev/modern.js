import { useEditLink } from '../../logic';
import Edit from '../../assets/edit.svg';
import styles from './index.module.scss';

interface EditLinkProps {
  editLink: {
    docRepoBaseUrl: string;
    text: string;
    relativePagePath: string;
  };
}

export default function EditLink({ editLink }: EditLinkProps) {
  const editLinkObj = useEditLink(editLink);

  if (!editLinkObj) {
    return null;
  }

  const { text } = editLinkObj;
  const docRepoBaseUrl = `${editLinkObj.docRepoBaseUrl}${editLinkObj.relativePagePath}`;

  return (
    <a href={docRepoBaseUrl} className={styles.editLink}>
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
