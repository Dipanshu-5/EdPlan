import { useEffect, useMemo, useState } from 'react';
import { searchUniversities } from '../../services/universityService.js';
import { save as saveStorage } from '../../utils/storage.js';

const stateOptions = [
  '',
  'AL',
  'AK',
  'AZ',
  'AR',
  'CA',
  'CO',
  'CT',
  'DE',
  'FL',
  'GA',
  'HI',
  'ID',
  'IL',
  'IN',
  'IA',
  'KS',
  'KY',
  'LA',
  'ME',
  'MD',
  'MA',
  'MI',
  'MN',
  'MS',
  'MO',
  'MT',
  'NE',
  'NV',
  'NH',
  'NJ',
  'NM',
  'NY',
  'NC',
  'ND',
  'OH',
  'OK',
  'OR',
  'PA',
  'RI',
  'SC',
  'SD',
  'TN',
  'TX',
  'UT',
  'VT',
  'VA',
  'WA',
  'WV',
  'WI',
  'WY'
];

const FindUniversity = ({ onSelectProgram }) => {
  const [universities, setUniversities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [costFilter, setCostFilter] = useState(60000);

  const fetchUniversities = async (overrides = {}) => {
    setLoading(true);
    setError('');
    try {
      const payload = await searchUniversities({
        search: overrides.search ?? searchTerm,
        state: overrides.state ?? stateFilter,
        perPage: 50
      });
      setUniversities(payload.data || []);
    } catch (err) {
      console.error(err);
      setError('Unable to load data from College Scorecard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUniversities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredUniversities = useMemo(() => {
    return universities.filter((university) => {
      const matchesCost =
        !university.average_annual_cost ||
        Number(university.average_annual_cost || 0) <= Number(costFilter);
      return matchesCost;
    });
  }, [universities, costFilter]);

  const handleSelect = (university) => {
    saveStorage('University', university.name);
    saveStorage('UniversityUnitId', university.unit_id);
    saveStorage('UniversityState', university.state);
    saveStorage('Programname', university.name);
    saveStorage('Programnameview', university.name);
    saveStorage('universityview', university.name);
    saveStorage('selectedComponent', 'program');
    if (onSelectProgram) {
      onSelectProgram(university);
    }
  };

  const handleSearch = (event) => {
    event.preventDefault();
    fetchUniversities({ search: searchTerm, state: stateFilter });
  };

  return (
    <section className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Explore colleges</h2>
          <p className="text-sm text-slate-500">
            Live College Scorecard data including cost, earnings, graduation rate, and more.
          </p>
        </div>
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3">
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="px-4 py-2 rounded-lg border border-slate-200"
            placeholder="Search by name or city"
          />
          <select
            value={stateFilter}
            onChange={(event) => setStateFilter(event.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200"
          >
            {stateOptions.map((state) => (
              <option key={state || 'all'} value={state}>
                {state ? state : 'All states'}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-slate-900 text-white font-medium hover:bg-slate-700"
            disabled={loading}
          >
            Search
          </button>
        </form>
      </header>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <label className="flex flex-col gap-1 text-sm text-slate-600">
          Max annual cost
          <input
            type="range"
            min="10000"
            max="90000"
            step="1000"
            value={costFilter}
            onChange={(event) => setCostFilter(Number(event.target.value))}
            className="accent-indigo-600"
          />
          <span className="text-xs text-slate-500">${costFilter.toLocaleString()}</span>
        </label>
        <div className="text-sm text-slate-600">
          <p className="font-semibold text-slate-700">Fields displayed</p>
          <p>Organization type, location, graduation rate, financial aid, earnings, and more.</p>
        </div>
      </div>

  {error && (
        <div className="bg-rose-50 text-rose-700 border border-rose-100 rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-sm text-slate-500">Loading live data…</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredUniversities.map((university) => {
            const websiteUrl = university.website
              ? university.website.startsWith('http')
                ? university.website
                : `https://${university.website}`
              : null;
            return (
              <article
                key={university.unit_id}
                className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 flex flex-col gap-3 hover:shadow-lg transition"
              >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{university.name}</h3>
                  <p className="text-sm text-slate-500">
                    {university.city}, {university.state} · {university.organization_type}
                  </p>
                </div>
                <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                  {university.location_type}
                </span>
              </div>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>Year: {university.year || 'N/A'}</li>
                <li>Size: {university.size ? university.size.toLocaleString() : 'N/A'} students</li>
                <li>
                  Graduation rate:{' '}
                  {university.graduation_rate
                    ? `${Math.round(university.graduation_rate * 100)}%`
                    : 'N/A'}
                </li>
                <li>
                  Average annual cost:{' '}
                  {university.average_annual_cost
                    ? `$${Number(university.average_annual_cost).toLocaleString()}`
                    : 'N/A'}
                </li>
                <li>
                  Median earnings:{' '}
                  {university.median_earnings
                    ? `$${Number(university.median_earnings).toLocaleString()}`
                    : 'N/A'}
                </li>
                <li>
                  Acceptance rate:{' '}
                  {university.acceptance_rate
                    ? `${Math.round(university.acceptance_rate * 100)}%`
                    : 'N/A'}
                </li>
              </ul>
              {websiteUrl && (
                <a
                  href={websiteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-indigo-600 hover:text-indigo-500"
                >
                  Visit website
                </a>
              )}
              <button
                type="button"
                onClick={() => handleSelect(university)}
                className="self-start px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-700"
              >
                View details
              </button>
            </article>
            );
          })}
          {filteredUniversities.length === 0 && (
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 text-sm text-slate-500">
              No universities found with the current filters.
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default FindUniversity;
