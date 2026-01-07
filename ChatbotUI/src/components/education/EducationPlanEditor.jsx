import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { addEducationPlan } from "../../services/authService.js";
import { listPrograms } from "../../services/educationPlanService.js";
import {
	load as loadStorage,
	save as saveStorage,
} from "../../utils/storage.js";
import toast from "react-hot-toast";

const LOCAL_PLAN_KEY = "LocalSavedPlans";
const normalizeRequirement = (value) => (value || "").trim();
const normalizeDegree = (value = "") => {
	const raw = value.trim().toLowerCase();
	const aliases = {
		certificate: "certificate",
		certificates: "certificate",
		certification: "certificate",
		associate: "associate",
		associates: "associate",
		"associate degree": "associate",
		bachelor: "bachelor",
		bachelors: "bachelor",
		"bachelor's": "bachelor",
		master: "master",
		masters: "master",
		"master's": "master",
	};
	if (aliases[raw]) return aliases[raw];
	if (raw.endsWith("s") && raw.length > 4) return raw.slice(0, -1);
	return raw;
};
const hasMeaningfulRequirement = (value) => {
	const normalized = normalizeRequirement(value).toLowerCase();
	return normalized && normalized !== "none" && normalized !== "n/a";
};
const dedupeCourses = (list = []) =>
	Array.from(new Map((list || []).map((c) => [c.code, c])).values());
const YEAR_ORDER = [
	"First Year",
	"Second Year",
	"Third Year",
	"Fourth Year",
	"Fifth Year",
];
const SEMESTER_ORDER = ["Fall", "Spring", "Summer", "Winter"];

const getYearRank = (year) => {
	if (!year) return Number.MAX_SAFE_INTEGER;
	const idx = YEAR_ORDER.findIndex(
		(label) => label.toLowerCase() === String(year).toLowerCase()
	);
	if (idx >= 0) return idx + 1;
	const parsed = parseInt(String(year).replace(/\D+/g, ""), 10);
	return Number.isFinite(parsed) ? parsed : Number.MAX_SAFE_INTEGER;
};

const getSemesterRank = (semester) => {
	if (!semester) return Number.MAX_SAFE_INTEGER;
	const idx = SEMESTER_ORDER.findIndex(
		(label) => label.toLowerCase() === String(semester).toLowerCase()
	);
	return idx >= 0 ? idx + 1 : Number.MAX_SAFE_INTEGER;
};

const isSameTerm = (a, b) =>
	normalizeRequirement(a.year) === normalizeRequirement(b.year) &&
	normalizeRequirement(a.semester) === normalizeRequirement(b.semester);

const isBefore = (a, b) => {
	const yearDiff = getYearRank(a.year) - getYearRank(b.year);
	if (yearDiff !== 0) return yearDiff < 0;
	return getSemesterRank(a.semester) < getSemesterRank(b.semester);
};

const buildCodeSet = (courses = []) =>
	new Set(
		(courses || [])
			.map((course) => course.code)
			.filter(Boolean)
			.map((code) => String(code).toUpperCase())
	);

const extractDependencyCodes = (text, knownCodes) => {
	if (!text || !knownCodes || knownCodes.size === 0) return [];
	const upper = String(text).toUpperCase();
	return Array.from(knownCodes).filter((code) => upper.includes(code));
};

const getDependencies = (course, knownCodes) => {
	const codeSet = knownCodes || new Set();
	return {
		prereqCodes: extractDependencyCodes(course.prerequisite, codeSet),
		coreqCodes: extractDependencyCodes(course.corequisite, codeSet),
	};
};

const validatePlan = (planCourses, knownCodes) => {
	const issues = [];
	(planCourses || []).forEach((course) => {
		const { prereqCodes, coreqCodes } = getDependencies(course, knownCodes);

		prereqCodes.forEach((code) => {
			const prereqCourse = planCourses.find((item) => item.code === code);
			if (!prereqCourse) {
				issues.push({
					courseCode: course.code,
					type: "prereq-missing",
					relatedCode: code,
					message: `${course.courseName} requires ${code} in a prior term.`,
					blocking: true,
				});
				return;
			}
			if (!isBefore(prereqCourse, course)) {
				issues.push({
					courseCode: course.code,
					type: "prereq-order",
					relatedCode: code,
					message: `${code} must be scheduled before ${course.courseName}.`,
					blocking: true,
				});
			}
		});

		coreqCodes.forEach((code) => {
			const coreqCourse = planCourses.find((item) => item.code === code);
			if (!coreqCourse) {
				issues.push({
					courseCode: course.code,
					type: "coreq-missing",
					relatedCode: code,
					message: `${course.courseName} requires co-requisite ${code} in the same term.`,
					blocking: true,
				});
				return;
			}
			if (!isSameTerm(coreqCourse, course)) {
				issues.push({
					courseCode: course.code,
					type: "coreq-term",
					relatedCode: code,
					message: `${code} must be taken in the same term as ${course.courseName}.`,
					blocking: true,
				});
			}
		});
	});
	return issues;
};

const EducationPlanEditor = () => {
	const [programs, setPrograms] = useState([]);
	const [selectedProgram, setSelectedProgram] = useState("");
	const selectedUniversity = loadStorage("University") || "";
	const [selectedDegree, setSelectedDegree] = useState("");
	const [courses, setCourses] = useState([]);
	const [availableCourses, setAvailableCourses] = useState([]);
	const [defaultPlan, setDefaultPlan] = useState([]);
	const [error, setError] = useState("");
	const [yearFilter, setYearFilter] = useState("");
	const [semesterFilter, setSemesterFilter] = useState("");
	const [dependencyIssues, setDependencyIssues] = useState([]);
	const [creditLimitModal, setCreditLimitModal] = useState(null);
	const userEmail = loadStorage("UserEmail");
	const navigate = useNavigate();

	useEffect(() => {
		listPrograms()
			.then((items) => setPrograms(items))
			.catch((err) => {
				console.error(err);
				setError("Unable to load program catalog.");
			});
		// Load program from storage on mount (keep university even if program is missing)
		const savedProgram = loadStorage("Programname", "");
		setSelectedProgram(savedProgram || "");
		const savedDegree =
			loadStorage("ProgramDegree", "") || loadStorage("SelectedDegreeLevel", "");
		if (savedDegree) {
			setSelectedDegree(savedDegree);
		}
	}, []);

	// When no program is selected, clear available courses
	useEffect(() => {
		if (!selectedProgram) {
			setAvailableCourses([]);
		}
	}, [selectedProgram]);

	// Update availableCourses when a program + university is selected and auto-fill default plan
	useEffect(() => {
		if (!selectedProgram || !selectedUniversity) {
			setAvailableCourses((prev) => prev || []);
			setCourses([]);
			setDefaultPlan([]);
			return;
		}

		const selectedDegreeNorm = normalizeDegree(selectedDegree);
		let match = null;
		if (selectedDegreeNorm) {
			match = programs.find(
				(program) =>
					program.program === selectedProgram &&
					program.university === selectedUniversity &&
					normalizeDegree(program.degree) === selectedDegreeNorm
			);
		} else {
			match = programs.find(
				(program) =>
					program.program === selectedProgram &&
					program.university === selectedUniversity
			);
		}
		if (!match) {
			setAvailableCourses([]);
			setCourses([]);
			setDefaultPlan([]);
			// preserve selectedDegree to reflect user's intent even if no data found
			return;
		}
		const uniqueCourses =
			(match.years || []).flatMap((entry) =>
				(entry.semesters || []).flatMap((s) =>
					(s.courses || []).map((course) => ({
						year: entry.year,
						semester: s.semester,
						code: course.code,
						name: course.name,
						credits: course.credits,
						prerequisite: course.prerequisite,
						corequisite: course.corequisite,
						schedule: course.schedule,
					}))
				)
			) || [];

		const cleanedCourses = dedupeCourses(uniqueCourses);
		setAvailableCourses(cleanedCourses);

		const builtDefaultPlan = dedupeCourses(
			cleanedCourses
				.filter((course) => !course.code?.toUpperCase().startsWith("ELEC"))
				.map((course) => ({
					program: selectedProgram,
					university: selectedUniversity,
					year: course.year,
					semester: course.semester,
					courseName: course.name,
					code: course.code,
					credits: course.credits,
					prerequisite: course.prerequisite,
					corequisite: course.corequisite,
					schedule: course.schedule,
				}))
		);
		setDefaultPlan(builtDefaultPlan);
		setCourses(builtDefaultPlan);
		const degreeToUse = selectedDegree || match.degree || "";
		setSelectedDegree(degreeToUse);
		saveStorage("ProgramDegree", degreeToUse);
	}, [programs, selectedProgram, selectedDegree, selectedUniversity]);

	const knownCodes = useMemo(
		() => buildCodeSet([...availableCourses, ...courses]),
		[availableCourses, courses]
	);

	useEffect(() => {
		setDependencyIssues(validatePlan(courses, knownCodes));
	}, [courses, knownCodes]);

	// Filter programs based on selected university
	const uniqueProgramOptions = useMemo(() => {
		const seen = new Set();
		let filteredPrograms = programs;

		// If university is selected, filter by that university
		if (selectedUniversity) {
			filteredPrograms = programs.filter(
				(program) => program.university === selectedUniversity
			);
		}

		// Remove duplicates
		return filteredPrograms.filter((program) => {
			const name = (program.program || "").trim().toLowerCase();
			if (!name || seen.has(name)) {
				return false;
			}
			seen.add(name);
			return true;
		});
	}, [programs, selectedUniversity]);

	// Clear selected program when university changes if the program is not available
	useEffect(() => {
		if (
			selectedProgram &&
			selectedUniversity &&
			uniqueProgramOptions.length > 0
		) {
			const programExists = uniqueProgramOptions.some(
				(p) => p.program === selectedProgram
			);
			if (!programExists) {
				setSelectedProgram("");
				saveStorage("Programname", "");
			}
		}
	}, [selectedUniversity, uniqueProgramOptions, selectedProgram]);

	const filteredPlanCourses = useMemo(() => {
		return courses.filter((course) => {
			const yearOk = yearFilter ? course.year === yearFilter : true;
			const semOk = semesterFilter ? course.semester === semesterFilter : true;
			return yearOk && semOk;
		});
	}, [courses, yearFilter, semesterFilter]);

	const groupedCourses = useMemo(() => {
		return filteredPlanCourses.reduce((acc, course) => {
			const key = `${course.year}::${course.semester}`;
			acc[key] = acc[key] || [];
			acc[key].push(course);
			return acc;
		}, {});
	}, [filteredPlanCourses]);

	const yearOptions = useMemo(
		() =>
			[...new Set(availableCourses.map((course) => course.year))].filter(
				Boolean
			),
		[availableCourses]
	);

	const selectedProgramMeta = useMemo(() => {
		if (!selectedProgram || !selectedUniversity) return null;
		const degreeNorm = normalizeDegree(selectedDegree);
		if (degreeNorm) {
			return (
				programs.find(
					(entry) =>
						entry.program === selectedProgram &&
						entry.university === selectedUniversity &&
						normalizeDegree(entry.degree) === degreeNorm
				) || null
			);
		}
		return (
			programs.find(
				(entry) =>
					entry.program === selectedProgram &&
					entry.university === selectedUniversity
			) || null
		);
	}, [programs, selectedProgram, selectedUniversity, selectedDegree]);

	const averageAnnualCost =
		selectedProgramMeta?.average_annual_cost ||
		selectedProgramMeta?.averageAnnualCost ||
		selectedProgramMeta?.college_profile?.average_annual_cost ||
		null;
	const eligibilityCriteria =
		selectedProgramMeta?.eligibility_criteria ||
		selectedProgramMeta?.eligibility ||
		selectedProgramMeta?.college_profile?.eligibility_criteria ||
		"";

	const programTotalCredits = selectedProgramMeta?.total_credit_hours ?? 0;

	// Filter courses to only show those not already in the plan
	const remainingCourses = useMemo(() => {
		const addedCourseCodes = new Set(courses.map((course) => course.code));
		return availableCourses.filter(
			(course) => !addedCourseCodes.has(course.code)
		);
	}, [availableCourses, courses]);

	const addCourse = (course) => {
		setCourses((prev) => {
			const newEntry = {
				program: selectedProgram,
				university: selectedUniversity,
				year: course.year,
				semester: course.semester,
				courseName: course.name,
				code: course.code,
				credits: course.credits,
				prerequisite: course.prerequisite,
				corequisite: course.corequisite,
				schedule: course.schedule,
			};

			if (prev.some((item) => item.code === newEntry.code)) {
				toast.error("Course already in your plan.");
				return prev;
			}

			// Check if adding this course would exceed total credit hours
			const requiredCredits = selectedProgramMeta?.total_credit_hours;
			if (requiredCredits) {
				const currentCredits = prev.reduce((sum, c) => {
					const value = Number(c.credits);
					return sum + (Number.isFinite(value) ? value : 0);
				}, 0);
				const newCourseCredits = Number(newEntry.credits);
				const validNewCredits = Number.isFinite(newCourseCredits)
					? newCourseCredits
					: 0;

				if (currentCredits + validNewCredits > requiredCredits) {
					setCreditLimitModal({
						courseName: newEntry.courseName,
						currentCredits,
						addingCredits: validNewCredits,
						totalWouldBe: currentCredits + validNewCredits,
						programLimit: requiredCredits,
					});
					return prev;
				}
			}

			const { prereqCodes, coreqCodes } = getDependencies(newEntry, knownCodes);

			for (const prereqCode of prereqCodes) {
				const prereqCourse = prev.find((item) => item.code === prereqCode);
				if (!prereqCourse) {
					toast(
						`${newEntry.courseName} requires ${prereqCode} in a prior term. Add the pre-requisite first.`
					);
					return prev;
				}
				if (!isBefore(prereqCourse, newEntry)) {
					toast(
						`${prereqCode} must be scheduled before ${newEntry.courseName}. Move the pre-requisite to an earlier term.`
					);
					return prev;
				}
			}

			const missingCoreqs = [];
			for (const code of coreqCodes) {
				const match = prev.find((item) => item.code === code);
				if (!match) {
					missingCoreqs.push(code);
					continue;
				}
				if (!isSameTerm(match, newEntry)) {
					toast(
						`${code} must be scheduled in ${newEntry.year} · ${newEntry.semester} with ${newEntry.courseName}. Move the co-requisite to the same term.`
					);
					return prev;
				}
			}

			const extraCourses = [];
			if (missingCoreqs.length) {
				const candidates = missingCoreqs
					.map((code) =>
						availableCourses.find(
							(item) =>
								item.code === code &&
								normalizeRequirement(item.year) ===
									normalizeRequirement(newEntry.year) &&
								normalizeRequirement(item.semester) ===
									normalizeRequirement(newEntry.semester)
						)
					)
					.filter(Boolean);

				const canAutoAdd = candidates.length === missingCoreqs.length;
				const confirmText = `Missing co-requisite ${missingCoreqs.join(
					", "
				)}. Add it to ${newEntry.year} · ${newEntry.semester}?`;
				if (canAutoAdd) {
					const confirmAdd = window.confirm(confirmText);
					if (confirmAdd) {
						candidates.forEach((item) => {
							if (prev.some((existing) => existing.code === item.code)) {
								return;
							}
							extraCourses.push({
								program: selectedProgram,
								university: selectedUniversity,
								year: item.year,
								semester: item.semester,
								courseName: item.name,
								code: item.code,
								credits: item.credits,
								prerequisite: item.prerequisite,
								corequisite: item.corequisite,
								schedule: item.schedule,
							});
						});
					} else {
						toast(
							`Co-requisite ${missingCoreqs.join(", ")} must be taken with ${
								newEntry.courseName
							}.`
						);
						return prev;
					}
				} else {
				toast(
					`Co-requisite ${missingCoreqs.join(", ")} must be taken with ${
						newEntry.courseName
					} in the same term.`
				);
				return dedupeCourses(prev);
			}
		}

			toast.success("Successfully Added")
			return dedupeCourses([...prev, newEntry, ...extraCourses]);
		});
	};

		const removeCourse = (code) => {
			setCourses((prev) => {
				const target = prev.find((course) => course.code === code);
				if (!target) return prev;

				const dependents = prev.filter((course) =>
					getDependencies(course, knownCodes).coreqCodes.includes(code)
				);
				const prereqDependents = prev.filter((course) =>
					getDependencies(course, knownCodes).prereqCodes.includes(code)
				);

				// Block removal when other courses depend on this one and show a single toast message.
				if (dependents.length > 0 || prereqDependents.length > 0) {
					const parts = [];
					
					if (dependents.length > 0) {
						parts.push(
							`${target.courseName} is tied to a co-requisite course.\n\n`
						);
					}
					if (prereqDependents.length > 0) {
						parts.push(
							`Can't Remove ${target.courseName} because it is a pre-requisite course.`
						);
					}
					toast.error(parts.join(" "));
					return prev;
				}

				// Safe to remove only the selected course
				toast.success("Successfully Removed")
				return dedupeCourses(prev.filter((course) => course.code !== code));
			});
		};

	const savePlanLocally = () => {
		if (!selectedUniversity || !selectedProgram) {
			toast.error("Select a university and program before saving.")
			return;
		}
		if (dependencyIssues.some((issue) => issue.blocking)) {
			toast.error("Fix pre-requisite/co-requisite issues before saving.");
			return;
		}
		if (programTotalCredits > 0 && totalCredits < programTotalCredits) {
			toast.error(
				`Add ${programTotalCredits - totalCredits} more credits to meet the required ${programTotalCredits}  credits.`
			);
			return;
		}
		const stored = loadStorage(LOCAL_PLAN_KEY, []);
		const filtered = stored.filter(
			(entry) =>
				entry.university !== selectedUniversity ||
				entry.program !== selectedProgram
		);
		const updated = [
			...filtered,
			{
				program: selectedProgram,
				university: selectedUniversity,
				courses,
			},
		];
		saveStorage(LOCAL_PLAN_KEY, updated);
		toast.success("Education plan saved.");
		navigate("/view");
	};

	const savePlan = async () => {
		if (!userEmail) {
			savePlanLocally();
			return;
		}
		if (dependencyIssues.some((issue) => issue.blocking)) {
			toast.error("Fix pre-requisite/co-requisite issues before saving.");
			return;
		}
		if (programTotalCredits > 0 && totalCredits < programTotalCredits) {
			toast.error(
				`Add ${programTotalCredits - totalCredits} more credits to meet the required ${programTotalCredits}  credits.`
			);
			return;
		}
		try {
			await addEducationPlan({
				email: userEmail,
				program: courses,
			});
			toast.success("Education plan saved.");
			saveStorage("vieweducation", courses);
			navigate("/view");
		} catch (err) {
			console.error(err);
			if (err.response?.status === 401) {
				toast.error("Your session has expired. Please login again.");
			} else {
				toast.error("Unable to save plan. Please try again later.");
			}
		}
	};

	// Program-level counts (static; do not change when user adds/removes)
	const prereqProgramCount = useMemo(
		() =>
			defaultPlan.filter((course) =>
				hasMeaningfulRequirement(course.prerequisite)
			).length,
		[defaultPlan]
	);
	const coreqProgramCount = useMemo(
		() =>
			defaultPlan.filter((course) =>
				hasMeaningfulRequirement(course.corequisite)
			).length,
		[defaultPlan]
	);
	// Live plan totals (only total courses should change as user edits)
	const totalCourses = useMemo(() => courses.length, [courses]);
	const totalCredits = useMemo(
		() =>
			courses.reduce((sum, course) => {
				const value = Number(course.credits);
				return sum + (Number.isFinite(value) ? value : 0);
			}, 0),
		[courses]
	);

	return (
		<section className="space-y-4">
			{/* Credit Limit Modal */}
			{creditLimitModal && (
				<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
					<div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in duration-200">
						<div className="flex items-start gap-4">
							<div className="flex-shrink-0 w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center">
								<svg
									className="w-6 h-6 text-rose-600"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
									/>
								</svg>
							</div>
							<div className="flex-1">
								<h3 className="text-lg font-semibold text-slate-900">
									Cannot add {creditLimitModal.courseName}
								</h3>
								<p className="text-sm text-slate-600 mt-1">
									This exceeds the programs total credit hours limit.
								</p>
							</div>
						</div>

						<div className="bg-slate-50 rounded-lg p-4 space-y-2 text-sm">
							<div className="flex justify-between items-center">
								<span className="text-slate-600">Current:</span>
								<span className="font-semibold text-slate-900">
									{creditLimitModal.currentCredits} credits
								</span>
							</div>
							<div className="flex justify-between items-center">
								<span className="text-slate-600">Adding:</span>
								<span className="font-semibold text-indigo-600">
									+{creditLimitModal.addingCredits} credits
								</span>
							</div>
							<div className="border-t border-slate-200 pt-2 flex justify-between items-center">
								<span className="text-slate-600">Total would be:</span>
								<span className="font-bold text-rose-600">
									{creditLimitModal.totalWouldBe} credits
								</span>
							</div>
							<div className="flex justify-between items-center">
								<span className="text-slate-600">Program limit:</span>
								<span className="font-bold text-slate-900">
									{creditLimitModal.programLimit} credits
								</span>
							</div>
						</div>

						<p className="text-sm text-slate-600">
							Remove some courses first to add {creditLimitModal.courseName} course.
						</p>

						<button
							onClick={() => setCreditLimitModal(null)}
							className="w-full px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
						>
							OK
						</button>
					</div>
				</div>
			)}

			<h1 className="text-3xl font-semibold text-slate-900">
				Customize Your Education <span className="text-[#0069e0]">Plan</span>
			</h1>
			<header className="grid gap-4 md:grid-cols-2 bg-white border border-slate-200 rounded-xl shadow-sm p-5">
				<label className="flex flex-col gap-2 text-sm font-semibold text-slate-600">
					University
					{selectedUniversity ? (
						<div className="px-3 py-2 w-fit bg-indigo-50 border font-normal border-indigo-200 rounded-lg text-sm text-indigo-700">
							Selected: <strong>{selectedUniversity}</strong>
							{selectedDegree && (
								<span className="ml-2 text-indigo-600">
									({selectedDegree})
								</span>
							)}
						</div>
					) : (
						<p className="text-base text-red-600 font-semibold mt-1">
							Select a University/College from the Find University Page.
						</p>
					)}
				</label>

				<label className="flex flex-col gap-2 font-semibold text-sm text-slate-600">
					Program
					<select
						value={selectedProgram}
						onChange={(event) => {
							setSelectedProgram(event.target.value);
							saveStorage("Programname", event.target.value);
							const found = programs.find(
								(p) =>
									p.program === event.target.value &&
									p.university === selectedUniversity
							);
							if (found) {
								setSelectedDegree(found.degree || "");
								saveStorage("ProgramDegree", found.degree || "");
							} else {
								setSelectedDegree("");
								saveStorage("ProgramDegree", "");
							}
						}}
						className="px-3 py-2 rounded-lg border border-slate-200"
					>
						<option value="">Select Program</option>
						{uniqueProgramOptions.map((program) => (
							<option
								key={`${program.university}-${program.program}`}
								value={program.program}
							>
								{program.program}
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

			{selectedProgram && selectedUniversity && (
				<div className="grid gap-6 lg:grid-cols-[2fr,1.4fr]">
					<div className="space-y-4">
						<h3 className="text-xl font-semibold text-slate-800">
							My Education Plan
						</h3>

						{dependencyIssues.length > 0 && (
							<div className="bg-rose-50 text-rose-700 border border-rose-200 rounded-xl shadow-sm p-4 space-y-2 text-sm">
								<div className="font-semibold flex items-center gap-2">
									<span aria-hidden="true">⚠</span>
									<span>Resolve these before saving:</span>
								</div>
								<ul className="list-disc list-inside space-y-1">
									{dependencyIssues.map((issue) => (
										<li
											key={`${issue.type}-${issue.courseCode}-${
												issue.relatedCode || ""
											}`}
										>
											{issue.message}
										</li>
									))}
								</ul>
							</div>
						)}

						<div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 space-y-4">
							<div className="flex flex-wrap items-center gap-3">
								<div className="flex items-center gap-2">
									<label className="font-semibold text-slate-700">Year:</label>
									<select
										value={yearFilter}
										onChange={(e) => setYearFilter(e.target.value)}
										className="border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold"
									>
										<option value="">All</option>
										{yearOptions.map((yr) => (
											<option key={yr} value={yr}>
												{yr}
											</option>
										))}
									</select>
								</div>
								<div className="flex items-center gap-2">
									<label className="font-semibold text-slate-700">
										Semester:
									</label>
									<select
										value={semesterFilter}
										onChange={(e) => setSemesterFilter(e.target.value)}
										className="border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold"
									>
										<option value="">All</option>
										{[
											...new Set(courses.map((c) => c.semester).filter(Boolean)),
										].map((sem) => (
											<option key={sem} value={sem}>
												{sem}
											</option>
										))}
									</select>
								</div>
								<button
									type="button"
									onClick={() => {
										setYearFilter("");
										setSemesterFilter("");
									}}
									className="text-sm font-semibold px-3 py-2 rounded-lg border border-slate-200 text-slate-700 hover:border-indigo-200 hover:text-blue-700 hover:bg-indigo-100"
								>
									Clear Filters
								</button>
								<button
									type="button"
									onClick={() => setCourses(defaultPlan)}
									className="text-sm font-semibold px-3 py-2 rounded-lg border border-indigo-200 text-blue-700 hover:bg-indigo-100"
								>
									Reset to Default Plan
								</button>
							</div>
							{totalCourses > 0 && (
								<div className="flex items-center gap-4 flex-wrap pt-3 border-t border-slate-200 text-sm text-slate-800 font-semibold">
									{totalCourses > 0 && (
										<span>
											Plan Overview:{" "}
											<span className="font-normal text-slate-700">
												This program includes <span className="font-semibold text-indigo-600">{totalCourses}</span> courses, <span className="font-semibold text-indigo-600">{prereqProgramCount}</span> with pre-requisites, <span className="font-semibold text-indigo-600">{coreqProgramCount}</span> with co-requisites.
											</span>
										</span>
									)}
									{averageAnnualCost && (
										<span>
											Avg. Annual Cost:{" "}
											<span className="text-emerald-700">
												{averageAnnualCost}
											</span>
										</span>
									)}
									{eligibilityCriteria && (
										<span>
											Eligibility Criteria:{" "}
											<span className="font-normal text-slate-700">
												{eligibilityCriteria}
											</span>
										</span>
									)}
									<span className="w-36">
										Total Credits:{" "}
										<span className="text-indigo-600">{totalCredits}</span>
									</span>
								</div>
							)}
						</div>

						{Object.entries(groupedCourses).map(([groupKey, courseList]) => {
							const [courseYear, courseSemester] = groupKey.split("::");
							const semesterCredits = courseList.reduce((sum, course) => {
								const value = Number(course.credits);
								return sum + (Number.isFinite(value) ? value : 0);
							}, 0);
							return (
								<div
									key={groupKey}
									className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 space-y-3"
								>
									<header className="flex items-center justify-between">
										<h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
											{courseYear} · {courseSemester}
										</h4>
										<span className="text-sm font-semibold text-indigo-600 mr-3">
											{semesterCredits} Credits
										</span>
									</header>
									<ul className="space-y-3">
										{courseList.map((course) => (
											<li
												key={course.code}
												className={`border rounded-lg p-3 flex flex-col gap-1 hover:border-indigo-200 hover:bg-indigo-50 ${
													dependencyIssues.some(
														(issue) => issue.courseCode === course.code
													)
														? "border-rose-200 bg-rose-50/60"
														: "border-slate-100"
												}`}
											>
												<div className="flex items-center justify-between gap-2">
													<span className="font-medium text-slate-800">
														{course.courseName}
													</span>
													<button
														type="button"
														onClick={() => removeCourse(course.code)}
														className="text-xs font-bold text-rose-500 hover:text-rose-600"
													>
														Remove
													</button>
												</div>
												{(() => {
													const prereqText = normalizeRequirement(
														course.prerequisite
													);
													const coreqText = normalizeRequirement(
														course.corequisite
													);
													const showPrereq = hasMeaningfulRequirement(prereqText);
													const showCoreq = hasMeaningfulRequirement(coreqText);

													return (
														<div className="text-xs text-slate-600 flex flex-wrap items-center gap-x-6 gap-y-2 leading-relaxed">
															<span className="inline-flex items-center gap-1 whitespace-nowrap">
																<span className="text-slate-600">Code:</span>
																<span className="font-medium text-slate-800">
																	{course.code}
																</span>
															</span>
															<span className="inline-flex items-center gap-1 whitespace-nowrap">
																<span className="text-slate-600">Credits:</span>
																<span className="font-medium text-slate-800">
																	{course.credits ?? "N/A"}
																</span>
															</span>
															<span className="inline-flex items-center gap-1 whitespace-nowrap">
																<span className="text-sky-700">
																	Pre-requisite:
																</span>
																<span
																	className={
																		showPrereq
																			? "text-orange-500 font-medium"
																			: "text-slate-500"
																	}
																>
																	{prereqText || "N/A"}
																</span>
															</span>
															{showCoreq && (
																<span className="inline-flex items-center gap-1 whitespace-nowrap">
																	<span className="text-sky-700">
																		Corequisite:
																	</span>
																	<span className="text-yellow-500 font-medium">
																		{coreqText}
																	</span>
																</span>
															)}
															{dependencyIssues
																.filter(
																	(issue) => issue.courseCode === course.code
																)
																.map((issue) => (
																	<span
																		key={`${issue.type}-${
																			issue.relatedCode || ""
																		}`}
																		className="inline-flex items-center gap-1 text-rose-600 font-semibold"
																	>
																		<span aria-hidden="true">⚠</span>
																		{issue.message}
																	</span>
																))}
														</div>
													);
												})()}
											</li>
										))}
									</ul>
								</div>
							);
						})}
					</div>

					<div className="bg-white border border-slate-200 rounded-xl shadow-sm mt-11 p-5 space-y-4 sticky top-6 h-fit">
						<div className="flex items-center justify-between">
							<h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
								Course catalog
							</h3>
							<button
								type="button"
								onClick={savePlan}
								disabled={dependencyIssues.some((issue) => issue.blocking)}
								className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
							>
								Save Plan
							</button>
						</div>
						<div
							className="overflow-y-auto space-y-3 text-sm"
							style={{ height: "calc(100% - 60px)" }}
						>
							{remainingCourses.length === 0 && (
								<p className="text-slate-500 text-base text-center">
									{availableCourses.length === 0
										? "Select a program to create your Education Plan."
										: "All courses have been added to your plan."}
								</p>
							)}
							{remainingCourses.map((course) => (
								<button
									key={`${course.code}-${course.semester}`}
									type="button"
									className="w-full text-left border border-slate-100 rounded-lg p-3 hover:border-indigo-200 hover:bg-indigo-50 transition"
									onClick={() => addCourse(course)}
								>
									<div className="flex">
										<div>
											<div className="font-medium text-slate-800">
												{course.name}
											</div>
											<div className="text-md text-slate-500 flex gap-3">
												<span>Code: {course.code}</span>
												<span>Year: {course.year}</span>
												<span>Semester: {course.semester}</span>
											</div>
										</div>
										<div className="flex justify-end ml-auto">
											<span className="text-md font-bold text-blue-700 mt-2">
												Add
											</span>
										</div>
									</div>
								</button>
							))}
						</div>
					</div>
				</div>
			)}
		</section>
	);
};

export default EducationPlanEditor;
