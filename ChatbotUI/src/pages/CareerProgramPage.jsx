import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";

const CareerProgramPage = () => {
  const [data, setData] = useState(null);
  const [selectedDegree, setSelectedDegree] = useState("");
  const [selectedProgram, setSelectedProgram] = useState("");
  const [notAvailable, setNotAvailable] = useState("");

  useEffect(() => {
    fetch("/assets/career_program_data.json")
      .then((res) => res.json())
      .then((json) => setData(json))
      .catch(() => setData({ degrees: [] }));
  }, []);

  const degreeOptions = useMemo(() => {
    if (!data?.degrees) return [];
    return [...data.degrees].sort((a, b) => a.name.localeCompare(b.name));
  }, [data]);

  const allPrograms = useMemo(() => {
    if (!data?.degrees) return [];
    const map = new Map();
    data.degrees.forEach((d) => {
      (d.programs || []).forEach((p) => {
        if (!map.has(p.name)) map.set(p.name, p);
      });
    });
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [data]);

  const programsForDegree = useMemo(() => {
    const degreeObj = degreeOptions.find((d) => d.name === selectedDegree);
    return (
      degreeObj?.programs
        ?.slice()
        .sort((a, b) => a.name.localeCompare(b.name)) || []
    );
  }, [selectedDegree, degreeOptions]);

  useEffect(() => {
    if (!selectedProgram || !selectedDegree) {
      setNotAvailable("");
      return;
    }

    const match = programsForDegree.find((p) => p.name === selectedProgram);

    if (!match) {
      setNotAvailable(
        `${selectedProgram} is not available in ${selectedDegree}`
      );
    } else {
      setNotAvailable("");
    }
  }, [selectedProgram, selectedDegree, programsForDegree]);

  const selectedProgramObj =
    selectedProgram && selectedDegree
      ? programsForDegree.find((p) => p.name === selectedProgram) || null
      : null;

  if (!data) return <div className="p-6">Loading...</div>;

  // Certificate -> Automotive Technology, Cybersecurity, Film & Digital Media Arts, Information Engineering Technology
  // Associate -> Automotive Technology, Cybersecurity, Business Administration, Nursing, Psychology
  // Bachelors -> Biology, Business Administration, Computer Science, Cybersecurity, Elementary Education, Film & Digital Media Arts, Information Engineering Technology, Management, Mechanical Engineering, Nursing, Psychology
  // Masters -> Business Administration (MBA), Computer Science, Cybersecurity, Management, Nursing, Psychology

  return (
    <div className="p-6">
      <header>
        <h2 className="text-2xl font-semibold mb-2">
          Career & Program Explorer
        </h2>
        <p className="text-sm text-slate-600 mb-4">
          Select a program and degree to view careers, salary ranges, and
          competencies.
        </p>
      </header>

      {notAvailable && (
        <p className="text-sm font-semibold text-center text-rose-600 mb-2">
          {notAvailable}
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-1">Program</label>
          <select
            className="w-full border rounded-md p-2"
            value={selectedProgram}
            onChange={(e) => setSelectedProgram(e.target.value)}
          >
            <option value="">Choose Program</option>
            {allPrograms.map((p) => (
              <option key={p.name} value={p.name}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Degree</label>
          <select
            className="w-full border rounded-md p-2"
            value={selectedDegree}
            onChange={(e) => setSelectedDegree(e.target.value)}
          >
            <option value="">Choose Degree</option>
            {degreeOptions.map((d) => (
              <option key={d.name} value={d.name}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        <Link
          to="/intake"
          className="px-4 mt-6 py-2 rounded-lg text-center h-fit bg-[#281ed5] hover:bg-[#1977e3] text-white font-medium md:w-[200px]"
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
            <p className="mt-52 text-center text-slate-600">
              Please select both program and degree to view details.
            </p>
          )}
        </div>
      </div>

      <section>

        {selectedProgramObj && selectedProgramObj.careers.length > 0 && (
          <div>
            <h3 className="text-xl font-semibold mb-3">Career Options</h3>

            <ul className="space-y-4">
              {selectedProgramObj.careers.map((c, idx) => (
                <li
                  key={c.title + idx}
                  className="border rounded-md p-4 hover:shadow-lg transition"
                >
                  <div className="flex items-center justify-between">
                    <strong className="text-lg text-[#0069e0]">
                      {c.title}
                    </strong>
                    <span className="text-sm font-semibold text-slate-600">
                      Salary Range: {c.salary}
                    </span>
                  </div>

                  {c.competencies && c.competencies.length > 0 && (
                    <div className="mt-4">
                      <p className="font-semibold text-slate-700 mb-3">
                        Key Competencies:
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {c.competencies.map((comp, idx) => {
                          let topic = "";
                          let desc = "";

                          if (typeof comp === "string") {
                            topic = comp;
                            desc = data.competencies?.[comp] || "";
                          } else if (comp && typeof comp === "object") {
                            topic = comp.topic || comp.name || "";
                            desc =
                              comp.description ||
                              data.competencies?.[topic] ||
                              "";
                          }

                          return (
                            <div
                              key={topic + idx}
                              className="flex gap-3 text-base p-3 bg-indigo-50 rounded-md border-l-4 border-indigo-400"
                            >
                              <div>
                                <strong className="text-indigo-700">
                                  {topic}:
                                </strong>
                                <p className="text-slate-600 mt-1">{desc}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
};

export default CareerProgramPage;
