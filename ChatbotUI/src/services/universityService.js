import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

const client = axios.create({
  baseURL: API_BASE_URL
});

export const searchUniversities = async ({ search, state, page = 0, perPage = 20 } = {}) => {
  const response = await client.get('/universities', {
    params: {
      search: search || undefined,
      state: state || undefined,
      page,
      per_page: perPage
    }
  });
  return response.data;
};

export const getUniversityById = async (unitId) => {
  const response = await client.get(`/universities/${unitId}`);
  return response.data?.data || null;
};

export const compareUniversitiesByIds = async (unitIds) => {
  const response = await client.post('/universities/compare', { unit_ids: unitIds });
  return response.data?.data || [];
};

export default {
  searchUniversities,
  getUniversityById,
  compareUniversitiesByIds
};
