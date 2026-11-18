import { useCallback, useEffect, useState } from 'react';
import { ApiError, getSession, type AuthSession } from '../../services/adminApi';

export function useRoomSession() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => setAttempt(value => value + 1), []);
  useEffect(() => {
    let disposed = false;
    let sequence = 0;
    const refresh = () => {
      const request = ++sequence;
      getSession().then(value => { if (!disposed && sequence === request) { setSession(value); setError(''); } })
        .catch((failure: unknown) => {
          if (disposed || sequence !== request) return;
          if (failure instanceof ApiError && failure.status === 401) { setSession(null); setError(''); }
          else setError('Không kiểm tra được phiên đăng nhập. Hãy thử lại.');
        }).finally(() => { if (!disposed && sequence === request) setLoading(false); });
    };
    refresh();
    window.addEventListener('vsl-session-changed', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      disposed = true;
      window.removeEventListener('vsl-session-changed', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, [attempt]);
  return { session, loading, error, retry };
}
