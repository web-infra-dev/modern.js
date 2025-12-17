import { upload } from 'bff-api-app/api/upload';
import { configure } from 'bff-api-app/runtime';
import React, { type JSX, useEffect } from 'react';

configure({
  setDomain() {
    return 'http://127.0.0.1:3399';
  },
});

const getMockImage = () => {
  const imageData =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==';
  const blob = new Blob(
    [Uint8Array.from(atob(imageData.split(',')[1]), c => c.charCodeAt(0))],
    { type: 'image/png' },
  );

  return new File([blob], 'mock_image.png', { type: 'image/png' });
};

const Index = (): JSX.Element => {
  const [file, setFile] = React.useState<FileList | null>();
  const [fileName, setFileName] = React.useState<string>('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData();
    if (file) {
      for (let i = 0; i < file.length; i++) {
        formData.append('images', file[i]);
      }
      await fetch('/bff-api/upload', {
        method: 'POST',
        body: formData,
      });
    }
  };

  const click = async () => {
    if (!file) {
      return;
    }
    const res = await upload({
      files: {
        images: file,
        params: JSON.stringify({
          a: 1,
          b: 2,
        }),
      },
    });
  };

  useEffect(() => {
    upload({
      files: {
        images: getMockImage(),
        params: JSON.stringify({
          a: 1,
          b: 2,
        }),
      },
    }).then(res => {
      setFileName(res.data.file_name);
    });
  }, []);

  return (
    <>
      <h1>File Upload</h1>
      <p className="mock_file">{fileName}</p>
      <form onSubmit={handleSubmit}>
        <input multiple type="file" onChange={handleChange} />
        <button type="submit">基于 fetch upload</button>
      </form>
      <div>
        <input multiple type="file" onChange={handleChange} />
        <button onClick={click}>一体化调用 upload</button>
      </div>
    </>
  );
};

export default Index;
