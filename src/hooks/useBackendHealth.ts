import { useEffect, useState } from 'react';

export function useBackendHealth(intervalMs = 10000) {
  const [health, setHealth] = useState<'loading' | 'connected' | 'disconnected'>('loading');

  useEffect(() => {
    const tick = async () => {
      try {
        const res = await fetch('http://localhost:3001/api/health');
        setHealth(res.ok ? 'connected' : 'disconnected');
      } catch {
        setHealth('disconnected');
      }
    };

    tick();
    const id = window.setInterval(tick, intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);

  return health;
}
