import { useState, useEffect } from 'react';
import { isMobileDevice, isTabletDevice, isTouchDevice, getDeviceType, isLandscape, isSlowConnection } from '../utils/mobileDetection';

export interface MobileDetectionState {
  isMobile: boolean;
  isTablet: boolean;
  isTouch: boolean;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  isLandscape: boolean;
  isSlowConnection: boolean;
  viewportWidth: number;
  viewportHeight: number;
}

export const useMobileDetection = (): MobileDetectionState => {
  const [state, setState] = useState<MobileDetectionState>({
    isMobile: false,
    isTablet: false,
    isTouch: false,
    deviceType: 'desktop',
    isLandscape: false,
    isSlowConnection: false,
    viewportWidth: 0,
    viewportHeight: 0,
  });

  useEffect(() => {
    const updateDetection = () => {
      setState({
        isMobile: isMobileDevice(),
        isTablet: isTabletDevice(),
        isTouch: isTouchDevice(),
        deviceType: getDeviceType(),
        isLandscape: isLandscape(),
        isSlowConnection: isSlowConnection(),
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
      });
    };

    // Initial detection
    updateDetection();

    // Update on resize and orientation change
    window.addEventListener('resize', updateDetection);
    window.addEventListener('orientationchange', updateDetection);

    return () => {
      window.removeEventListener('resize', updateDetection);
      window.removeEventListener('orientationchange', updateDetection);
    };
  }, []);

  return state;
};
