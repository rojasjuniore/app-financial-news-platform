import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLazyImage } from '../../hooks/usePerformance';
import ShimmerEffect from '../Loading/ShimmerEffect';
import { ImageIcon, AlertCircle } from 'lucide-react';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholderClassName?: string;
  width?: number;
  height?: number;
  placeholder?: string;
  objectFit?: 'cover' | 'contain' | 'fill' | 'scale-down' | 'none';
  onLoad?: () => void;
  onError?: () => void;
  showLoadingShimmer?: boolean;
}

const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className = '',
  placeholderClassName = '',
  width,
  height,
  placeholder,
  objectFit = 'cover',
  onLoad,
  onError,
  showLoadingShimmer = true
}) => {
  const [hasError, setHasError] = useState(false);
  const { ref, imageSrc, isLoading, isError, isIntersecting } = useLazyImage(
    src,
    placeholder
  );

  const handleLoad = useCallback(() => {
    if (onLoad) onLoad();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setHasError(true);
    if (onError) onError();
  }, [onError]);

  const imageVariants = {
    hidden: { opacity: 0, scale: 1.1 },
    visible: {
      opacity: 1,
      scale: 1
    }
  };

  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className={`relative overflow-hidden ${className}`}
      style={{ width, height }}
    >
      <AnimatePresence mode="wait">
        {/* Loading State */}
        {isLoading && isIntersecting && showLoadingShimmer && (
          <motion.div
            key="loading"
            className={`absolute inset-0 flex items-center justify-center bg-gray-100 ${placeholderClassName}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <ShimmerEffect 
              width="w-full" 
              height="h-full" 
              className="absolute inset-0"
              rounded={false}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <ImageIcon className="w-8 h-8 text-gray-400" />
            </div>
          </motion.div>
        )}

        {/* Error State */}
        {(isError || hasError) && (
          <motion.div
            key="error"
            className={`absolute inset-0 flex flex-col items-center justify-center bg-gray-50 text-gray-400 ${placeholderClassName}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <AlertCircle className="w-8 h-8 mb-2" />
            <span className="text-sm">Error cargando imagen</span>
          </motion.div>
        )}

        {/* Loaded Image */}
        {imageSrc && !isLoading && !isError && !hasError && (
          <motion.img
            key="image"
            src={imageSrc}
            alt={alt}
            className={`w-full h-full object-${objectFit}`}
            variants={imageVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ duration: 0.6, ease: "easeOut" }}
            onLoad={handleLoad}
            onError={handleError}
            loading="lazy"
            decoding="async"
          />
        )}

        {/* Placeholder when not intersecting */}
        {!isIntersecting && (
          <motion.div
            key="placeholder"
            className={`absolute inset-0 bg-gray-100 flex items-center justify-center ${placeholderClassName}`}
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
          >
            <ImageIcon className="w-8 h-8 text-gray-300" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progressive enhancement overlay */}
      {isLoading && imageSrc && (
        <motion.div
          className="absolute inset-0 bg-white"
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        />
      )}
    </div>
  );
};

export default React.memo(LazyImage);