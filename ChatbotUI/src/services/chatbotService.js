import { searchUniversities, compareUniversitiesByIds } from './universityService.js';

const resolveUniversityByName = async (query) => {
  if (!query) return null;
  const response = await searchUniversities({ search: query, perPage: 1 });
  const [first] = response.data || [];
  return first || null;
};

export const getTopUniversities = async (criteria = {}) => {
  const response = await searchUniversities({
    search: criteria.location || criteria.query,
    state: criteria.state,
    perPage: 10
  });
  return response.data?.slice(0, 5) || [];
};

export const compareUniversities = async (nameA, nameB) => {
  const [uniA, uniB] = await Promise.all([
    resolveUniversityByName(nameA),
    resolveUniversityByName(nameB)
  ]);

  if (!uniA || !uniB) {
    throw new Error('Please select two valid universities to compare.');
  }

  const compare = await compareUniversitiesByIds([uniA.unit_id, uniB.unit_id]);
  const [detailA, detailB] = compare.length >= 2 ? compare : [uniA, uniB];
  const describe = (label, accessor, formatter = (v) => v ?? 'N/A') => {
    const valueA = accessor(detailA);
    const valueB = accessor(detailB);
    return `${label}: ${formatter(valueA)} vs ${formatter(valueB)}`;
  };

  return [
    `${uniA.name} vs ${uniB.name}`,
    describe('Location', (uni) => `${uni.city}, ${uni.state}`),
    describe('Graduation Rate', (uni) => uni.graduation_rate, (val) =>
      val ? `${Math.round(val * 100)}%` : 'N/A'
    ),
    describe('Average Annual Cost', (uni) => uni.average_annual_cost, (val) =>
      val ? `$${Number(val).toLocaleString()}` : 'N/A'
    ),
    describe('Median Earnings', (uni) => uni.median_earnings, (val) =>
      val ? `$${Number(val).toLocaleString()}` : 'N/A'
    ),
    describe('Acceptance Rate', (uni) => uni.acceptance_rate, (val) =>
      val ? `${Math.round(val * 100)}%` : 'N/A'
    )
  ];
};

export const loadProgramDetails = async () => {
  const response = await searchUniversities({ perPage: 6 });
  return response.data || [];
};
