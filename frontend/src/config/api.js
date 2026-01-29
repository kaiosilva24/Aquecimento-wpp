// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export const API_URL = API_BASE_URL;

export const getApiUrl = (path) => {
    return `${API_BASE_URL}${path}`;
};
