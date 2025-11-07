import { useEffect, useMemo, useState } from 'react';
import {
  addEducationPlan,
  getEducationPlan
} from '../../services/authService.js';
import { findProgramPlan } from '../../services/educationPlanService.js';
import { load as loadStorage } from '../../utils/storage.js';

const EducationPlan = () => {
  const [plan, setPlan] = useState(null);
  const [gridData, setGridData] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const programName =
    loadStorage('Programname') ||
    loadStorage('Programnameview') ||
    'Bachelor of Science in Nursing';
  const universityName =
    loadStorage('University') || loadStorage('universityview') || 'University of New Mexico';
  const userEmail = loadStorage('UserEmail');

  const groupedCourses = useMemo(() => {
    return gridData.reduce((acc, course) => {
      const year = course.year || 'Year 1';
      const semester = course.semester || 'Semester 1';
      acc[year] = acc[year] || {};
      acc[year][semester] = acc[year][semester] || [];
      acc[year][semester].push(course);
      return acc;
    }, {});
  }, [gridData]);

  const loadPlan = async () => {
    setLoading(true);
    setError('');
    try {
      if (userEmail) {
        const response = await getEducationPlan({
          email: userEmail,
          programName,
          universityName
        });
        const program = response.data?.data?.program;
        if (program?.length) {
          setGridData(program);
          setPlan({ program: programName, university: universityName });
          return;
        }
      }

      const fallbackPlan = await findProgramPlan(programName, universityName);
      if (!fallbackPlan) {
        setError('No education plan data found for the selected program.');
        return;
      }
      const flattened =
        fallbackPlan.years?.flatMap((year) =>
          year.semesters.flatMap((semester) =>
            semester.courses.map((course) => ({
              program: fallbackPlan.program,
              university: fallbackPlan.university,
              year: year.year,
              semester: semester.semester,
              code: course.code,
              courseName: course.name,
              credits: course.credits,
              prerequisite: course.prerequisite,
              corequisite: course.corequisite,
              schedule: course.schedule
            }))
          )
        ) || [];
      setGridData(flattened);
      setPlan({
        program: fallbackPlan.program,
        university: fallbackPlan.university
      });
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) {
        setError('Your session has expired. Please login again to load saved plans.');
      } else {
        setError('Unable to load education plan right now.');
      }
    } finally {
      setLoading(false);
    }
  };

  const removeCourse = (code) => {
    setGridData((prev) => prev.filter((course) => course.code !== code));
  };

  const savePlan = async () => {
    if (!userEmail) {
      alert('Please login before saving your education plan.');
      return;
    }
    try {
      await addEducationPlan({
        email: userEmail,
        program: gridData
      });
      alert('Education plan saved successfully!');
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) {
        alert('Your session has expired. Please login again.');
      } else {
        alert('Failed to save education plan. Please try again.');
      }
    }
  };

  useEffect(() => {
    loadPlan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse text-slate-500 text-sm">Loading education plan…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-rose-50 text-rose-700 border border-rose-100 rounded-lg px-4 py-3">
          {error}
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="p-6">
        <div className="bg-amber-50 text-amber-700 border border-amber-100 rounded-lg px-4 py-3">
          Select a university and program to generate a plan.
        </div>
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">{plan.program}</h2>
          <p className="text-sm text-slate-500">{plan.university}</p>
        </div>
        <button
          type="button"
          onClick={savePlan}
          className="self-start md:self-end px-5 py-2.5 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-500"
        >
          Save plan
        </button>
      </header>

      <div className="space-y-6">
        {Object.entries(groupedCourses).map(([year, semesters]) => (
          <div key={year} className="space-y-4">
            <h3 className="text-xl font-semibold text-slate-800">{year}</h3>
            <div className="grid gap-4 md:grid-cols-2">
              {Object.entries(semesters).map(([semester, courses]) => (
                <div
                  key={semester}
                  className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 space-y-3"
                >
                  <h4 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
                    {semester}
                  </h4>
                  <ul className="space-y-3 text-sm text-slate-700">
                    {courses.map((course) => (
                      <li
                        key={course.code}
                        className="border border-slate-100 rounded-lg p-3 flex flex-col gap-1"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-slate-800">
                            {course.courseName}
                          </span>
                          <button
                            type="button"
                            className="text-xs text-rose-500 hover:text-rose-600"
                            onClick={() => removeCourse(course.code)}
                          >
                            Remove
                          </button>
                        </div>
                        <div className="text-xs text-slate-500">
                          Code: <span className="font-medium">{course.code}</span> · Credits:{' '}
                          {course.credits ?? 'N/A'}
                        </div>
                        {course.prerequisite && (
                          <div className="text-xs text-slate-500">
                            Prerequisites: {course.prerequisite}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default EducationPlan;
