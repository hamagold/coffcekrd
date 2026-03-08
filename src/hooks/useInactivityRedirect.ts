import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchCafeConfig } from '@/hooks/useAdminLang';

export function useInactivityRedirect(hasActiveOrder?: boolean) {
  const navigate = useNavigate();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasActiveOrderRef = useRef(hasActiveOrder);

  // Keep ref in sync
  useEffect(() => {
    hasActiveOrderRef.current = hasActiveOrder;
  }, [hasActiveOrder]);

  useEffect(() => {
    let cancelled = false;

    fetchCafeConfig().then(config => {
      if (cancelled) return;
      const inactivity = config.inactivity;
      if (!inactivity?.enabled) return;

      const reset = () => {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          // Don't redirect if user has items in cart or active order
          if (hasActiveOrderRef.current) {
            reset(); // restart timer instead
            return;
          }
          navigate('/');
        }, (inactivity.timeout || 30) * 1000);
      };

      const events = ['mousedown', 'mousemove', 'keydown', 'touchstart', 'scroll'];
      events.forEach(e => window.addEventListener(e, reset));
      reset();

      (timerRef as any)._events = events;
      (timerRef as any)._reset = reset;
    });

    return () => {
      cancelled = true;
      if (timerRef.current) clearTimeout(timerRef.current);
      const events = (timerRef as any)?._events;
      const reset = (timerRef as any)?._reset;
      if (events && reset) {
        events.forEach((e: string) => window.removeEventListener(e, reset));
      }
    };
  }, [navigate]);
}
