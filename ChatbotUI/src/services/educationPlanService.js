let educationCache = null;

const loadPrograms = async () => {
  if (educationCache) return educationCache;
  const response = await fetch('/assets/responses/programdetail.json');
  if (!response.ok) {
    throw new Error('Unable to load education plans');
  }
  educationCache = await response.json();
  return educationCache;
};

export const findProgramPlan = async (programName, universityName) => {
  const programs = await loadPrograms();
  return (
    programs.find(
      (program) =>
        program.program === programName && program.university === universityName
    ) || null
  );
};

export const listPrograms = async () => loadPrograms();
