import { useEffect, useMemo, useState } from 'react';
import { getUniversityById } from '../../services/universityService.js';
import { load as loadStorage, save as saveStorage } from '../../utils/storage.js';

const formatPercent = (value) => (value || value === 0 ? `${Math.round(value * 100)}%` : 'N/A');
const formatCurrency = (value) =>
  value || value === 0 ? `$${Number(value).toLocaleString()}` : 'N/A';

const ProgramDetail = ({ onNavigateToPlan }) => {
  const [university, setUniversity] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const unitId = loadStorage('UniversityUnitId');

  useEffect(() => {
    if (!unitId) {
      setUniversity(null);
      return;
    }
    const fetchDetail = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await getUniversityById(unitId);
        setUniversity(data);
      } catch (err) {
        console.error(err);
        setError('Unable to load college detail from College Scorecard.');
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [unitId]);

  const diversityEntries = useMemo(() => {
    if (!university?.campus_diversity) return [];
    return Object.entries(university.campus_diversity).filter(
      ([, value]) => value !== null && value !== undefined
    );
  }, [university]);

  const openPlan = () => {
    saveStorage('selectedComponent', 'education');
    if (onNavigateToPlan) {
      onNavigateToPlan();
    }
  };

  if (!unitId) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 text-sm text-slate-500">
        Select a university to view detailed metrics.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 text-sm text-slate-500">
        Loading university insights…
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 text-sm text-rose-600">
        {error}
      </div>
    );
  }

  if (!university) {
    return null;
  }

  const websiteUrl = university.website
    ? university.website.startsWith('http')
      ? university.website
      : `https://${university.website}`
    : null;

  return (
    <section className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">{university.name}</h2>
          <p className="text-sm text-slate-500">
            {university.city}, {university.state} · {university.organization_type}
          </p>
        </div>
        <button
          type="button"
          onClick={openPlan}
          className="self-start md:self-end px-5 py-2.5 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-500"
        >
          Open in planner
        </button>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <article className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 space-y-3">
          <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Overview</h3>
          <ul className="text-sm text-slate-700 space-y-2">
            <li>Academic year: {university.year || 'N/A'}</li>
            <li>Institution size: {university.size ? university.size.toLocaleString() : 'N/A'}</li>
            <li>Campus setting: {university.location_type || 'N/A'}</li>
            <li>Graduation rate: {formatPercent(university.graduation_rate)}</li>
            <li>Average annual cost: {formatCurrency(university.average_annual_cost)}</li>
            <li>Median earnings (10 yrs after entry): {formatCurrency(university.median_earnings)}</li>
          </ul>
          {websiteUrl && (
            <a
              href={websiteUrl}
              className="text-indigo-600 hover:text-indigo-500 text-sm font-medium"
              target="_blank"
              rel="noreferrer"
            >
              Visit official website
            </a>
          )}
        </article>

        <article className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 space-y-3">
          <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
            Admissions & outcomes
          </h3>
          <ul className="text-sm text-slate-700 space-y-2">
            <li>Test score (SAT/ACT avg): {university.test_score ?? 'N/A'}</li>
            <li>Acceptance rate: {formatPercent(university.acceptance_rate)}</li>
            <li>
              Financial aid & debt:{' '}
              {formatCurrency(university.financial_aid_debt) || 'Data unavailable'}
            </li>
            <li>Typical earnings: {formatCurrency(university.typical_earnings)}</li>
          </ul>
        </article>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 space-y-3">
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
          Campus diversity
        </h3>
        {diversityEntries.length === 0 ? (
          <p className="text-sm text-slate-500">Diversity data unavailable.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-3 text-sm text-slate-700">
            {diversityEntries.map(([label, value]) => (
              <div key={label} className="border border-slate-100 rounded-lg p-3">
                <div className="text-xs uppercase text-slate-500">{label.replace('_', ' ')}</div>
                <div className="text-base font-semibold">{formatPercent(value)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default ProgramDetail;
