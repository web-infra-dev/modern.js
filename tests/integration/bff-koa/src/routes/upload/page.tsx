import { upload } from '@api/upload';
import React from 'react';

export default (): JSX.Element => {
  const [file, setFile] = React.useState<FileList | null>();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData();
    if (file) {
      for (let i = 0; i < file.length; i++) {
        formData.append('file', file[i]);
      }
      await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
    }
  };

  const handleUpload = () => {
    if (!file) {
      return;
    }
    upload({
      files: {
        images: file,
      },
    });
  };

  return (
    <>
      <h1>File Upload</h1>
      <form onSubmit={handleSubmit}>
        <input multiple type="file" onChange={handleChange} />
        <button type="submit">基于 fetch upload</button>
      </form>
      <div>
        <input multiple type="file" onChange={handleChange} />
        <button onClick={handleUpload}>一体化调用 upload</button>
      </div>
    </>
  );
};
