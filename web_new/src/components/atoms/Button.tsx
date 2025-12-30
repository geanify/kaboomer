import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'icon';
}

export const Button: React.FC<ButtonProps> = ({ variant = 'primary', className = '', ...props }) => {
  const baseStyles = "rounded-full font-bold transition-transform active:scale-95 disabled:opacity-50";
  const variants = {
    primary: "bg-spotify-green text-black px-6 py-3 hover:bg-[#1ed760]",
    secondary: "bg-transparent border border-gray-500 text-white px-6 py-2 hover:border-white",
    icon: "p-2 hover:bg-spotify-light-gray text-white",
  };

  return (
    <button className={`${baseStyles} ${variants[variant]} ${className}`} {...props} />
  );
};

