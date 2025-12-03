import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const CareerProgramPage = () => {
  const [data, setData] = useState(null);
  const [selectedDegree, setSelectedDegree] = useState("");
  const [selectedProgram, setSelectedProgram] = useState("");

  useEffect(() => {
    fetch("/assets/career_program_data.json")
      .then((res) => res.json())
      .then((json) => {
        setData(json);
      })
      .catch(() => setData({ degrees: [] }));
  }, []);

  if (!data) return <div className="p-6">Loading...</div>;

  const degreeOptions = data.degrees || [];
  const programsForDegree =
    degreeOptions.find((d) => d.name === selectedDegree)?.programs || [];
  const selectedProgramObj = programsForDegree.find(
    (p) => p.name === selectedProgram
  );

  return (
    <div className="p-6">
      <header>
        <h2 className="text-2xl font-semibold mb-2">
          Career & Program Explorer
        </h2>
        <p className="text-sm text-slate-600 mb-4">
          Select a degree and program to view careers, salary ranges, and
          competencies.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-1">Degree</label>
          <select
            className="w-full border rounded-md p-2"
            value={selectedDegree}
            onChange={(e) => {
              setSelectedDegree(e.target.value);
              setSelectedProgram("");
            }}
          >
            <option value="">Choose Degree</option>
            {degreeOptions.map((d) => (
              <option key={d.name} value={d.name}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Program</label>
          <select
            className="w-full border rounded-md p-2"
            value={selectedProgram}
            onChange={(e) => setSelectedProgram(e.target.value)}
          >
            <option value="">Choose Program</option>
            {programsForDegree.map((p) => (
              <option key={p.name} value={p.name}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <Link
          to="/intake"
          className="px-4 mt-6 py-2 rounded-lg text-center h-fit bg-slate-900 text-white font-medium hover:bg-slate-700 md:w-[200px]"
        >
          Next
        </Link>

        <div className="md:col-span-3">
          {selectedProgramObj ? (
            <div className="mt-4">
              <h3 className="text-lg font-medium">Program Summary</h3>
              <p className="text-slate-600 mb-2">
                {selectedProgramObj.description}
              </p>
            </div>
          ) : (
            <p className="text-sm text-center text-slate-600">
              No program selected.
            </p>
          )}
        </div>
      </div>

      <section>
        {selectedProgramObj && selectedProgramObj.careers.length > 0 ? (
          <div>
            <h3 className="text-xl font-semibold mb-3">Career Options</h3>
            <ul className="space-y-4">
              {selectedProgramObj.careers.map((c) => (
                <li key={c.title} className="border rounded-md p-4">
                  <div className="flex items-center justify-between">
                    <strong className="text-md text-[#0069e0]">
                      {c.title}
                    </strong>
                    <span className="text-sm text-slate-600">
                      Salary: {c.salary}
                    </span>
                  </div>
                  <p className="mt-2 text-md inline text-slate-600">
                    Competencies:{" "}
                  </p>
                  {c.competencies && c.competencies.length > 0 && (
                    <div className="mt-3 inline-flex flex-wrap gap-3">
                      {c.competencies.map((comp) => (
                        <span
                          key={comp}
                          className="text-sm px-3 py-1 bg-indigo-100/50 rounded-full"
                        >
                          {comp}
                        </span>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          ""
        )}
      </section>
    </div>
  );
};

export default CareerProgramPage;
