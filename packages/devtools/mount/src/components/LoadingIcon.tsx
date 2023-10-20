import React from 'react';

export const LoaderIcon: React.FC<React.SVGProps<SVGSVGElement>> = props => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    strokeWidth="2"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <circle
      cx="12"
      cy="12"
      r="10"
      strokeDasharray="56.548667764616276"
      strokeDashoffset="14.137166941154069"
    />
  </svg>
);
