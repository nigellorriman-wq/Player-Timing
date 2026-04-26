import { useEffect, useState } from 'react';

export function useWakeLock() {
  const [isSupported, setIsSupported] = useState(false);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    setIsSupported('wakeLock' in navigator);
  }, []);

  const requestWakeLock = async () => {
    if (!isSupported) return;

    try {
      const sentinel = await (navigator as any).wakeLock.request('screen');
      setIsActive(true);
      
      sentinel.addEventListener('release', () => {
        setIsActive(false);
      });

      return sentinel;
    } catch (err) {
      console.error('Wake Lock request failed:', err);
    }
  };

  return { isSupported, isActive, requestWakeLock };
}
