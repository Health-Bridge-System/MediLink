import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../lib/api.js';

// GET a path and keep { data, error, loading } in state; `reload()` refetches.
// Passing null skips the request (e.g. while an id is not known yet).
export function useApi(path) {
  const [state, setState] = useState({ data: null, error: null, loading: Boolean(path) });
  const current = useRef(path);

  const load = useCallback(async () => {
    if (!path) return;
    current.current = path;
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await api.get(path);
      if (current.current === path) setState({ data, error: null, loading: false });
    } catch (error) {
      if (current.current === path) setState({ data: null, error, loading: false });
    }
  }, [path]);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, reload: load };
}
