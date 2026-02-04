export const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;

  // Check user agent
  const userAgent = navigator.userAgent.toLowerCase();
  const mobileKeywords = ['android', 'webos', 'iphone', 'ipad', 'ipod', 'blackberry', 'windows phone'];
  const isMobileUA = mobileKeywords.some(keyword => userAgent.includes(keyword));

  // Check touch capability
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  // Check screen size
  const isSmallScreen = window.innerWidth < 768;

  // Check for tablet vs phone
  const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024 && hasTouch;

  return (isMobileUA || hasTouch) && isSmallScreen && !isTablet;
};

export const isTabletDevice = (): boolean => {
  if (typeof window === 'undefined') return false;

  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const isTabletSize = window.innerWidth >= 768 && window.innerWidth < 1024;

  return hasTouch && isTabletSize;
};

export const isTouchDevice = (): boolean => {
  if (typeof window === 'undefined') return false;

  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

export const getDeviceType = (): 'mobile' | 'tablet' | 'desktop' => {
  if (isMobileDevice()) return 'mobile';
  if (isTabletDevice()) return 'tablet';
  return 'desktop';
};

export const getViewportWidth = (): number => {
  return typeof window !== 'undefined' ? window.innerWidth : 0;
};

export const getViewportHeight = (): number => {
  return typeof window !== 'undefined' ? window.innerHeight : 0;
};

// Check if device is landscape
export const isLandscape = (): boolean => {
  return getViewportWidth() > getViewportHeight();
};

// Check connection quality (if available)
export const getConnectionType = (): string => {
  if (typeof navigator !== 'undefined' && 'connection' in navigator) {
    const connection = (navigator as any).connection;
    return connection?.effectiveType || 'unknown';
  }
  return 'unknown';
};

export const isSlowConnection = (): boolean => {
  const connectionType = getConnectionType();
  return connectionType === 'slow-2g' || connectionType === '2g';
};
