export const BASE_API_URL = import.meta.env.VITE_BASE_API_URL || 'http://localhost:5000';

export const API_ENDPOINTS = {
  BASE: BASE_API_URL,
  AUTH: `${BASE_API_URL}/api/auth`,
  VOCABULARY: `${BASE_API_URL}/api/vocabulary`,
  MEMBERS: `${BASE_API_URL}/api/members`,
  FAVOURITES: `${BASE_API_URL}/api/favourites`,
  PROGRESS: `${BASE_API_URL}/api/progress`,
};