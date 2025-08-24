'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Box, Skeleton } from '@mui/material';

export interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  sizes?: string;
  quality?: number;
  priority?: boolean;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  className?: string;
  style?: React.CSSProperties;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  objectPosition?: string;
  onLoad?: () => void;
  onError?: () => void;
  loading?: 'lazy' | 'eager';
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  fill = false,
  sizes = '100vw',
  quality = 85,
  priority = false,
  placeholder = 'blur',
  blurDataURL,
  className,
  style,
  objectFit = 'cover',
  objectPosition = 'center',
  onLoad,
  onError,
  loading = 'lazy',
  ...props
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  // Generate blur data URL if not provided
  const defaultBlurDataURL = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=';

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setError(true);
    setIsLoading(false);
    onError?.();
  };

  // Show error fallback
  if (error) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'grey.100',
          color: 'grey.500',
          fontSize: '0.875rem',
          ...(fill 
            ? { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }
            : { width, height }
          ),
          ...style,
        }}
      >
        画像を読み込めません
      </Box>
    );
  }

  // Responsive sizes based on common breakpoints
  const responsiveSizes = sizes === 'responsive' 
    ? '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'
    : sizes;

  return (
    <Box sx={{ position: 'relative', ...(fill ? {} : { width, height }) }}>
      {/* Loading skeleton */}
      {isLoading && (
        <Box
          sx={{
            position: fill ? 'absolute' : 'static',
            top: fill ? 0 : undefined,
            left: fill ? 0 : undefined,
            right: fill ? 0 : undefined,
            bottom: fill ? 0 : undefined,
            width: fill ? '100%' : width,
            height: fill ? '100%' : height,
            zIndex: 1,
          }}
        >
          <Skeleton
            variant="rectangular"
            width="100%"
            height="100%"
            animation="wave"
            sx={{ borderRadius: 1 }}
          />
        </Box>
      )}

      {/* Optimized Image */}
      <Image
        src={src}
        alt={alt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        fill={fill}
        sizes={responsiveSizes}
        quality={quality}
        priority={priority}
        placeholder={placeholder}
        blurDataURL={blurDataURL || defaultBlurDataURL}
        className={className}
        style={{
          objectFit,
          objectPosition,
          opacity: isLoading ? 0 : 1,
          transition: 'opacity 0.3s ease-in-out',
          ...style,
        }}
        loading={loading}
        onLoad={handleLoad}
        onError={handleError}
        {...props}
      />
    </Box>
  );
};

// Preset configurations for common use cases
export const AvatarImage: React.FC<Omit<OptimizedImageProps, 'objectFit' | 'quality'>> = (props) => (
  <OptimizedImage {...props} objectFit="cover" quality={90} />
);

export const ThumbnailImage: React.FC<Omit<OptimizedImageProps, 'quality' | 'loading'>> = (props) => (
  <OptimizedImage {...props} quality={75} loading="lazy" />
);

export const HeroImage: React.FC<Omit<OptimizedImageProps, 'priority' | 'quality'>> = (props) => (
  <OptimizedImage {...props} priority={true} quality={95} />
);

export const ResponsiveImage: React.FC<Omit<OptimizedImageProps, 'sizes' | 'quality'>> = (props) => (
  <OptimizedImage {...props} sizes="responsive" quality={85} />
);

export default OptimizedImage;