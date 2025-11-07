import { useMemo, useState } from 'react';

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const timeSlots = [
  '08:00 AM',
  '09:00 AM',
  '10:00 AM',
  '11:00 AM',
  '12:00 PM',
  '01:00 PM',
  '02:00 PM',
  '03:00 PM',
  '04:00 PM'
];

const initialSchedule = [
  { courseName: 'Software Engineering I', day: 'Monday', time: '10:00 AM' },
  { courseName: 'Data Structures', day: 'Tuesday', time: '11:00 AM' },
  { courseName: 'Database Systems', day: 'Wednesday', time: '09:00 AM' }
];

const ScheduleMyCourse = () => {
  const [schedule, setSchedule] = useState(initialSchedule);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [draftDay, setDraftDay] = useState('');
  const [draftTime, setDraftTime] = useState('');
  const [reason, setReason] = useState('');
  const [rescheduled, setRescheduled] = useState([]);

  const courseBySlot = useMemo(
    () =>
      schedule.reduce((lookup, course) => {
        lookup[`${course.day}-${course.time}`] = course;
        return lookup;
      }, {}),
    [schedule]
  );

  const openModal = (course) => {
    setSelectedCourse(course);
    setDraftDay(course.day);
    setDraftTime(course.time);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedCourse(null);
    setReason('');
  };

  const saveReschedule = () => {
    if (!selectedCourse) return;
    setSchedule((prev) =>
      prev.map((course) =>
        course.courseName === selectedCourse.courseName
          ? { ...course, day: draftDay, time: draftTime }
          : course
      )
    );
    setRescheduled((prev) => [
      ...prev,
      {
        courseName: selectedCourse.courseName,
        day: draftDay,
        time: draftTime,
        reason
      }
    ]);
    closeModal();
  };

  const saveSchedule = () => {
    alert('Schedule saved successfully!');
  };

  return (
    <section className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
        <header className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Weekly Course Schedule</h2>
            <p className="text-sm text-slate-500">
              Click a course to reschedule it or add unavailable time slots.
            </p>
          </div>
          <button
            type="button"
            onClick={saveSchedule}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-500"
          >
            Save Schedule
          </button>
        </header>

        <div className="grid grid-cols-[100px_repeat(5,1fr)] gap-2">
          <div />
          {daysOfWeek.map((day) => (
            <div key={day} className="text-sm font-semibold text-slate-500 text-center">
              {day}
            </div>
          ))}

          {timeSlots.map((slot) => (
            <>
              <div
                key={`label-${slot}`}
                className="text-xs font-semibold text-slate-400 flex items-center justify-end pr-2"
              >
                {slot}
              </div>
              {daysOfWeek.map((day) => {
                const course = courseBySlot[`${day}-${slot}`];
                return (
                  <button
                    type="button"
                    key={`${day}-${slot}`}
                    className="h-20 rounded-lg border border-dashed border-slate-200 text-xs text-slate-400 hover:border-indigo-300 transition"
                    onClick={() => course && openModal(course)}
                  >
                    {course ? (
                      <div className="flex flex-col items-center justify-center gap-1 text-slate-700">
                        <span className="font-semibold text-sm">{course.courseName}</span>
                        <span>{course.time}</span>
                      </div>
                    ) : (
                      <span>Available</span>
                    )}
                  </button>
                );
              })}
            </>
          ))}
        </div>
      </div>

      {rescheduled.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
          <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
            Rescheduled courses
          </h3>
          <ul className="space-y-2 text-sm text-slate-600">
            {rescheduled.map((item) => (
              <li key={`${item.courseName}-${item.time}`}>
                {item.courseName} → {item.day} at {item.time}
                {item.reason ? ` (${item.reason})` : ''}
              </li>
            ))}
          </ul>
        </div>
      )}

      {modalOpen && selectedCourse && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4">
            <header>
              <h3 className="text-lg font-semibold text-slate-900">
                Reschedule {selectedCourse.courseName}
              </h3>
              <p className="text-sm text-slate-500">Select a new day and time for this course.</p>
            </header>
            <div className="grid gap-4">
              <label className="space-y-1 text-sm text-slate-600">
                Day
                <select
                  value={draftDay}
                  onChange={(event) => setDraftDay(event.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                >
                  {daysOfWeek.map((day) => (
                    <option key={day} value={day}>
                      {day}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1 text-sm text-slate-600">
                Time
                <select
                  value={draftTime}
                  onChange={(event) => setDraftTime(event.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                >
                  {timeSlots.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1 text-sm text-slate-600">
                Reason (optional)
                <textarea
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  rows="3"
                />
              </label>
            </div>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveReschedule}
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-500"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default ScheduleMyCourse;
