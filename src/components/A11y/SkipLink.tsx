import React from 'react';

interface SkipLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * SkipLink component for keyboard navigation
 * Allows users to skip to main content or other important sections
 */
const SkipLink: React.FC<SkipLinkProps> = ({ 
  href, 
  children, 
  className = '' 
}) => {
  return (
    <a
      href={href}
      className={`
        skip-link
        sr-only
        focus:not-sr-only
        focus:absolute
        focus:top-4
        focus:left-4
        focus:z-50
        focus:px-4
        focus:py-2
        focus:bg-blue-600
        focus:text-white
        focus:rounded-md
        focus:shadow-lg
        focus:font-medium
        focus:outline-none
        focus:ring-2
        focus:ring-blue-500
        focus:ring-offset-2
        focus:transition-none
        ${className}
      `.trim()}
      onFocus={(e) => {
        // Ensure the link is visible when focused
        e.currentTarget.style.transform = 'translateY(0)';
      }}
      onBlur={(e) => {
        // Reset position when focus is lost
        e.currentTarget.style.transform = 'translateY(-100%)';
      }}
    >
      {children}
    </a>
  );
};

/**
 * Collection of common skip links for the application
 */
export const SkipLinks: React.FC = () => {
  return (
    <div className="skip-links">
      <SkipLink href="#main-content">
        Saltar al contenido principal
      </SkipLink>
      <SkipLink href="#navigation">
        Saltar a la navegación
      </SkipLink>
      <SkipLink href="#search">
        Saltar a la búsqueda
      </SkipLink>
    </div>
  );
};

export default SkipLink;