const envUrl = (import.meta as any)?.env?.VITE_API_URL;
export const BACKEND_URL = (
  envUrl !== undefined && envUrl !== ''
    ? envUrl
    : (typeof window !== 'undefined' && window.location.origin && !window.location.origin.includes('vercel.app')
        ? window.location.origin
        : 'https://veltech-academic-management.onrender.com')
).replace(/\/+$/, '');
const API_BASE = (BACKEND_URL ? BACKEND_URL : '') + '/api';

export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(errorData.error || `HTTP error ${res.status}`);
  }

  return res.json();
}
