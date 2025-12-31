import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input: React.FC<InputProps> = ({ className = '', ...props }) => {
  return (
    <input 
      className={`bg-spotify-white text-black rounded-full px-4 py-3 w-full focus:outline-none ${className}`}
      {...props}
    />
  );
};



