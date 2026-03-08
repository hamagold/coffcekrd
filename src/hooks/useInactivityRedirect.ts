import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchCafeConfig } from '@/hooks/useAdminLang';

export function useInactivityRedirect() {
  const navigate = useNavigate();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetchCafeConfig().then(config => {
      if (cancelled) return;
      const inactivity = config.inactivity;
      if (!inactivity?.enabled) return;

      const reset = () => {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          navigate('/');
        }, (inactivity.timeout || 30) * 1000);
      };

      const events = ['mousedown', 'mousemove', 'keydown', 'touchstart', 'scroll'];
      events.forEach(e => window.addEventListener(e, reset));
      reset();

      // Store cleanup ref
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
