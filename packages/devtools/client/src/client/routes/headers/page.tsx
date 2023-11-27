import React, { useEffect } from 'react';
import { useSnapshot } from 'valtio';
import { useNavigate } from '@modern-js/runtime/router';
import { $state } from './state';

const Page: React.FC = () => {
  const { service } = useSnapshot($state);
  const navigate = useNavigate();

  useEffect(() => {
    navigate(service.rules ? './editor' : './welcome');
  }, []);

  return null;
};

export default Page;
