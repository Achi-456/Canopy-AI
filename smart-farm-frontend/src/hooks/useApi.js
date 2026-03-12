import { useState, useCallback } from 'react';

const API_BASE = 'http://localhost:5000/api';

export function useApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const request = useCallback(async (endpoint, options = {}) => {
    setLoading(true);
    setError(null);
    try {
      const url = `${API_BASE}${endpoint}`;
      const config = {
        headers: { 'Content-Type': 'application/json' },
        ...options,
      };
      if (config.body && typeof config.body === 'object') {
        config.body = JSON.stringify(config.body);
      }
      const response = await fetch(url, config);
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      const data = await response.json();
      setLoading(false);
      return data;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      throw err;
    }
  }, []);

  const get = useCallback((endpoint) => request(endpoint), [request]);
  const post = useCallback((endpoint, body) => 
    request(endpoint, { method: 'POST', body }), [request]);

  return { get, post, loading, error };
}
