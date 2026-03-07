import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export const getInactivityConfig = () => {
  try {
    const saved = localStorage.getItem('plc_inactivity');
    if (saved) return JSON.parse(saved);
  } catch {}
  return { enabled: true, timeout: 30 };
};

export const setInactivityConfig = (config: { enabled: boolean; timeout: number }) => {
  localStorage.setItem('plc_inactivity', JSON.stringify(config));
};

export function useInactivityRedirect() {
  const navigate = useNavigate();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const config = getInactivityConfig();
    if (!config.enabled) return;

    const reset = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        navigate('/');
      }, config.timeout * 1000);
    };

    const events = ['mousedown', 'mousemove', 'keydown', 'touchstart', 'scroll'];
    events.forEach(e => window.addEventListener(e, reset));
    reset();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach(e => window.removeEventListener(e, reset));
    };
  }, [navigate]);
}
