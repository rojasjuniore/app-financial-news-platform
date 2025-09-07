import React from 'react';

interface ShimmerEffectProps {
  width?: string;
  height?: string;
  className?: string;
  rounded?: boolean;
  variant?: 'light' | 'medium' | 'dark';
}

const ShimmerEffect: React.FC<ShimmerEffectProps> = ({
  width = 'w-full',
  height = 'h-4',
  className = '',
  rounded = true,
  variant = 'light'
}) => {
  const baseClasses = `${width} ${height} ${className} relative overflow-hidden`;
  
  const backgroundClasses = {
    light: 'bg-gray-100',
    medium: 'bg-gray-200',
    dark: 'bg-gray-300'
  }[variant];

  const roundedClass = rounded ? 'rounded' : '';

  return (
    <div className={`${baseClasses} ${backgroundClasses} ${roundedClass}`}>
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
    </div>
  );
};

// Shimmer animation keyframes - add to your global CSS
const shimmerStyles = `
@keyframes shimmer {
  100% {
    transform: translateX(100%);
  }
}
`;

export { shimmerStyles };
export default React.memo(ShimmerEffect);