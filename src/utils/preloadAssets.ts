/**
 * Utility for preloading critical assets to improve performance
 */

export const preloadImages = (imageUrls: string[]) => {
  if (typeof window === 'undefined') return;

  imageUrls.forEach((url) => {
    const img = new Image();
    img.src = url;
  });
};

export const preloadFonts = () => {
  if (typeof document === 'undefined') return;

  // Create a link element for each font file
  const fonts: string[] = [
    // Add your font URLs here if you have specific font files
  ];

  fonts.forEach((fontUrl) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'font';
    link.href = fontUrl;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  });
};

export const preloadCriticalAssets = () => {
  preloadImages([
    '/images/unicorn-logo.svg',
    // Add other critical images here
  ]);
};

export default preloadCriticalAssets;
