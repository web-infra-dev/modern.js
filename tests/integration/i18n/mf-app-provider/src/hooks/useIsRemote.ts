import { useEffect, useState } from 'react';

const useIsRemote = () => {
  const [isRemote, setIsRemote] = useState(false);

  useEffect(() => {
    // Check for a URL parameter that indicates embedding
    const searchParams = new URLSearchParams(window.location.search);
    console.log('searchParams', searchParams);
    setIsRemote(searchParams.has('embedded'));

    // Alternatively, check for a global variable or a specific DOM element
    // setIsRemote(window.parent !== window || document.getElementById('embed-flag') !== null);
  }, []);

  return isRemote;
};

export default useIsRemote;
