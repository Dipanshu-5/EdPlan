import { useEffect, useMemo, useState } from 'react';
import {
  addEducationPlan,
  getEducationPlan
} from '../../services/authService.js';
import { listPrograms } from '../../services/educationPlanService.js';
import { load as loadStorage, save as saveStorage } from '../../utils/storage.js';

const defaultSemesters = ['Fall', 'Spring'];

const EducationPlanEditor = () => {
  const [programs, setPrograms] = useState([]);
  const [selectedProgram, setSelectedProgram] = useState(loadStorage('Programname') || '');
  const [selectedUniversity, setSelectedUniversity] = useState(loadStorage('University') || '');
  const [year, setYear] = useState('');
  const [semester, setSemester] = useState('');
  const [courses, setCourses] = useState([]);
  const [availableCourses, setAvailableCourses] = useState([]);
  const [error, setError] = useState('');
  const userEmail = loadStorage('UserEmail');

  useEffect(() => {
    listPrograms()
      .then((items) => setPrograms(items))
      .catch((err) => {
        console.error(err);
        setError('Unable to load program catalogue.');
      });
  }, []);

  useEffect(() => {
    const loadExistingPlan = async () => {
      if (!selectedProgram || !selectedUniversity) {
        setCourses([]);
        setAvailableCourses([]);
        return;
      }
      setError('');

      try {
        if (userEmail) {
          const response = await getEducationPlan({
            email: userEmail,
            programName: selectedProgram,
            universityName: selectedUniversity
          });
          const program = response.data?.data?.program;
          if (program?.length) {
            setCourses(program);
            return;
          }
        }

        const match = programs.find(
          (program) =>
            program.program === selectedProgram && program.university === selectedUniversity
        );
        if (!match) {
          setCourses([]);
          return;
        }
        const flattened =
          match.years?.flatMap((yearEntry) =>
            yearEntry.semesters.flatMap((semesterEntry) =>
              semesterEntry.courses.map((course) => ({
                program: match.program,
                university: match.university,
                year: yearEntry.year,
                semester: semesterEntry.semester,
                code: course.code,
                courseName: course.name,
                credits: course.credits,
                prerequisite: course.prerequisite,
                corequisite: course.corequisite,
                schedule: course.schedule
              }))
            )
          ) || [];
        setCourses(flattened);
        const uniqueCourses =
          match.years?.flatMap((entry) =>
            entry.semesters.flatMap((s) =>
              s.courses.map((course) => ({
                year: entry.year,
                semester: s.semester,
                ...course
              }))
            )
          ) || [];
        setAvailableCourses(uniqueCourses);
      } catch (err) {
        console.error(err);
        if (err.response?.status === 401) {
          setError('Your session has expired. Please login again to load saved plans.');
        } else {
          setError('Unable to load education plan.');
        }
      }
    };
    loadExistingPlan();
  }, [programs, selectedProgram, selectedUniversity, userEmail]);

  const filteredAvailableCourses = useMemo(() => {
    if (!year || !semester) return availableCourses;
    return availableCourses.filter((course) => course.year === year && course.semester === semester);
  }, [availableCourses, semester, year]);

  const groupedCourses = useMemo(() => {
    return courses.reduce((acc, course) => {
      const key = `${course.year}::${course.semester}`;
      acc[key] = acc[key] || [];
      acc[key].push(course);
      return acc;
    }, {});
  }, [courses]);

  const addCourse = (course) => {
    setCourses((prev) => {
      if (prev.some((item) => item.code === course.code)) {
        alert('Course already in your plan.');
        return prev;
      }
      return [
        ...prev,
        {
          program: selectedProgram,
          university: selectedUniversity,
          year: year || course.year,
          semester: semester || course.semester,
          courseName: course.name,
          code: course.code,
          credits: course.credits,
          prerequisite: course.prerequisite,
          corequisite: course.corequisite,
          schedule: course.schedule
        }
      ];
    });
  };

  const removeCourse = (code) => {
    setCourses((prev) => prev.filter((course) => course.code !== code));
  };

  const savePlan = async () => {
    if (!userEmail) {
      alert('Please login before saving changes.');
      return;
    }
    try {
      await addEducationPlan({
        email: userEmail,
        program: courses
      });
      alert('Education plan saved.');
      saveStorage('vieweducation', courses);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) {
        alert('Your session has expired. Please login again.');
      } else {
        alert('Unable to save plan. Please try again later.');
      }
    }
  };

  return (
    <section className="space-y-6">
      <header className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 bg-white border border-slate-200 rounded-xl shadow-sm p-5">
        <label className="flex flex-col gap-1 text-sm text-slate-600">
          Program
          <select
            value={selectedProgram}
            onChange={(event) => {
              setSelectedProgram(event.target.value);
              saveStorage('Programname', event.target.value);
            }}
            className="px-3 py-2 rounded-lg border border-slate-200"
          >
            <option value="">Select program</option>
            {programs.map((program) => (
              <option key={`${program.university}-${program.program}`} value={program.program}>
                {program.program}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm text-slate-600">
          University
          <select
            value={selectedUniversity}
            onChange={(event) => {
              setSelectedUniversity(event.target.value);
              saveStorage('University', event.target.value);
            }}
            className="px-3 py-2 rounded-lg border border-slate-200"
          >
            <option value="">Select university</option>
            {[...new Set(programs.map((program) => program.university))].map((university) => (
              <option key={university} value={university}>
                {university}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm text-slate-600">
          Year
          <select
            value={year}
            onChange={(event) => setYear(event.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200"
          >
            <option value="">All years</option>
            {[...new Set(availableCourses.map((course) => course.year))].map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm text-slate-600">
          Semester
          <select
            value={semester}
            onChange={(event) => setSemester(event.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200"
          >
            <option value="">All semesters</option>
            {defaultSemesters.map((entry) => (
              <option key={entry} value={entry}>
                {entry}
              </option>
            ))}
          </select>
        </label>
      </header>

      {error && (
        <div className="bg-rose-50 text-rose-700 border border-rose-100 rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-800">My education plan</h3>
          {Object.keys(groupedCourses).length === 0 && (
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 text-sm text-slate-500">
              Add courses from the catalogue to build your plan.
            </div>
          )}

          {Object.entries(groupedCourses).map(([groupKey, courseList]) => {
            const [courseYear, courseSemester] = groupKey.split('::');
            return (
              <div
                key={groupKey}
                className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 space-y-3"
              >
                <header>
                  <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
                    {courseYear} · {courseSemester}
                  </h4>
                </header>
                <ul className="space-y-3">
                  {courseList.map((course) => (
                    <li
                      key={course.code}
                      className="border border-slate-100 rounded-lg p-3 flex flex-col gap-1"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-slate-800">{course.courseName}</span>
                        <button
                          type="button"
                          onClick={() => removeCourse(course.code)}
                          className="text-xs text-rose-500 hover:text-rose-600"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="text-xs text-slate-500 flex gap-4 flex-wrap">
                        <span>Code: {course.code}</span>
                        <span>Credits: {course.credits ?? 'N/A'}</span>
                        {course.prerequisite && <span>Prereq: {course.prerequisite}</span>}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
              Course catalogue
            </h3>
            <button
              type="button"
              onClick={savePlan}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500"
            >
              Save changes
            </button>
          </div>
          <div className="max-h-[480px] overflow-y-auto space-y-3 text-sm">
            {filteredAvailableCourses.length === 0 && (
              <p className="text-slate-500 text-sm">
                Select a program to view suggested courses.
              </p>
            )}
            {filteredAvailableCourses.map((course) => (
              <button
                key={`${course.code}-${course.semester}`}
                type="button"
                className="w-full text-left border border-slate-100 rounded-lg p-3 hover:border-indigo-200 hover:bg-indigo-50 transition"
                onClick={() => addCourse(course)}
              >
                <div className="font-medium text-slate-800">{course.name}</div>
                <div className="text-xs text-slate-500 flex gap-3">
                  <span>Code: {course.code}</span>
                  <span>Year: {course.year}</span>
                  <span>Semester: {course.semester}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default EducationPlanEditor;
