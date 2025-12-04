import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { addEducationPlan } from "../../services/authService.js";
import { listPrograms } from "../../services/educationPlanService.js";
import {
	load as loadStorage,
	save as saveStorage,
} from "../../utils/storage.js";

const LOCAL_PLAN_KEY = "LocalSavedPlans";
const normalizeRequirement = (value) => (value || "").trim();
const hasMeaningfulRequirement = (value) => {
	const normalized = normalizeRequirement(value).toLowerCase();
	return normalized && normalized !== "none" && normalized !== "n/a";
};
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
	const [selectedProgram, setSelectedProgram] = useState(
		loadStorage("Programname") || ""
	);
	const [selectedUniversity, setSelectedUniversity] = useState(
		loadStorage("University") || ""
	);
	const [courses, setCourses] = useState([]);
	const [availableCourses, setAvailableCourses] = useState([]);
	const [defaultPlan, setDefaultPlan] = useState([]);
	const [error, setError] = useState("");
	const [yearFilter, setYearFilter] = useState("");
	const [semesterFilter, setSemesterFilter] = useState("");
	const [dependencyIssues, setDependencyIssues] = useState([]);
	const userEmail = loadStorage("UserEmail");
	const navigate = useNavigate();

	useEffect(() => {
		listPrograms()
			.then((items) => setPrograms(items))
			.catch((err) => {
				console.error(err);
				setError("Unable to load program catalogue.");
			});
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

		const match = programs.find(
			(program) =>
				program.program === selectedProgram &&
				program.university === selectedUniversity
		);
		if (!match) {
			setAvailableCourses([]);
			setCourses([]);
			setDefaultPlan([]);
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

		setAvailableCourses(uniqueCourses);

		const builtDefaultPlan = uniqueCourses.map((course) => ({
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
		}));
		setDefaultPlan(builtDefaultPlan);
		setCourses(builtDefaultPlan);
	}, [programs, selectedProgram, selectedUniversity]);

	const knownCodes = useMemo(
		() => buildCodeSet([...availableCourses, ...courses]),
		[availableCourses, courses]
	);

	useEffect(() => {
		setDependencyIssues(validatePlan(courses, knownCodes));
	}, [courses, knownCodes]);

	const uniqueProgramOptions = useMemo(() => {
		const seen = new Set();
		return programs.filter((program) => {
			const name = (program.program || "").trim().toLowerCase();
			if (!name || seen.has(name)) {
				return false;
			}
			seen.add(name);
			return true;
		});
	}, [programs]);

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
				alert("Course already in your plan.");
				return prev;
			}

			const { prereqCodes, coreqCodes } = getDependencies(newEntry, knownCodes);

			for (const prereqCode of prereqCodes) {
				const prereqCourse = prev.find((item) => item.code === prereqCode);
				if (!prereqCourse) {
					alert(
						`${newEntry.courseName} requires ${prereqCode} in a prior term. Add the prerequisite first.`
					);
					return prev;
				}
				if (!isBefore(prereqCourse, newEntry)) {
					alert(
						`${prereqCode} must be scheduled before ${newEntry.courseName}. Move the prerequisite to an earlier term.`
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
					alert(
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
						alert(
							`Co-requisite ${missingCoreqs.join(", ")} must be taken with ${
								newEntry.courseName
							}.`
						);
						return prev;
					}
				} else {
					alert(
						`Co-requisite ${missingCoreqs.join(", ")} must be taken with ${
							newEntry.courseName
						} in the same term.`
					);
					return prev;
				}
			}

			return [...prev, newEntry, ...extraCourses];
		});
	};

	const removeCourse = (code) => {
		setCourses((prev) => {
			const target = prev.find((course) => course.code === code);
			if (!target) return prev;

			const { coreqCodes, prereqCodes } = getDependencies(target, knownCodes);
			const dependents = prev.filter((course) =>
				getDependencies(course, knownCodes).coreqCodes.includes(code)
			);
			const prereqDependents = prev.filter((course) =>
				getDependencies(course, knownCodes).prereqCodes.includes(code)
			);

			const toRemove = new Set([code]);
			coreqCodes.forEach((coreq) => toRemove.add(coreq));
			dependents.forEach((course) => toRemove.add(course.code));

			const warnings = [];

			if (coreqCodes.length > 0 || dependents.length > 0) {
				const linked = [...coreqCodes, ...dependents.map((item) => item.code)]
					.filter(Boolean)
					.join(", ");
				if (linked) {
					warnings.push(
						`Removing ${target.courseName} will also remove linked co-requisites: ${linked}.`
					);
				}
			}

			if (prereqDependents.length > 0) {
				warnings.push(
					`${target.courseName} is a prerequisite for: ${prereqDependents
						.map((item) => `${item.courseName} (${item.code})`)
						.join(
							", "
						)}. Restore this prerequisite or remove those courses before saving.`
				);
			}

			if (prereqCodes.length > 0) {
				warnings.push(
					`Prerequisite course(s) ${prereqCodes.join(
						", "
					)} become optional after removing ${target.courseName}.`
				);
			}

			if (warnings.length > 0) {
				alert(warnings.join("\n\n"));
			}

			return prev.filter((course) => !toRemove.has(course.code));
		});
	};

	const savePlanLocally = () => {
		if (!selectedUniversity || !selectedProgram) {
			alert("Select a university and program before saving.");
			return;
		}
		if (dependencyIssues.some((issue) => issue.blocking)) {
			alert("Fix prerequisite/co-requisite issues before saving.");
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
		alert("Education plan saved locally.");
		navigate("/view");
	};

	const savePlan = async () => {
		if (!userEmail) {
			savePlanLocally();
			return;
		}
		if (dependencyIssues.some((issue) => issue.blocking)) {
			alert("Fix prerequisite/co-requisite issues before saving.");
			return;
		}
		try {
			await addEducationPlan({
				email: userEmail,
				program: courses,
			});
			alert("Education plan saved.");
			saveStorage("vieweducation", courses);
			navigate("/view");
		} catch (err) {
			console.error(err);
			if (err.response?.status === 401) {
				alert("Your session has expired. Please login again.");
			} else {
				alert("Unable to save plan. Please try again later.");
			}
		}
	};

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
		<section className="space-y-6">
			<h2 className="text-2xl font-semibold text-slate-900">
				Customize Your Education Plan
			</h2>
			<header className="grid gap-4 md:grid-cols-2 bg-white border border-slate-200 rounded-xl shadow-sm p-5">
				<label className="flex flex-col gap-2 text-sm font-semibold text-slate-600">
					University
					{selectedUniversity && (
						<div className="px-3 py-2 w-fit bg-indigo-50 border font-normal border-indigo-200 rounded-lg text-sm text-indigo-700">
							Selected: <strong>{selectedUniversity}</strong>
						</div>
					)}
				</label>

				<label className="flex flex-col gap-2 font-semibold text-sm text-slate-600">
					Program
					<select
						value={selectedProgram}
						onChange={(event) => {
							setSelectedProgram(event.target.value);
							saveStorage("Programname", event.target.value);
						}}
						className="px-3 py-2 rounded-lg border font-normal border-slate-200"
					>
						<option value="">Select program</option>
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
								<label className="text-sm font-semibold text-slate-700">
									Year
								</label>
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
								<label className="text-sm font-semibold text-slate-700">
									Semester
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
								Clear filters
							</button>
							<button
								type="button"
								onClick={() => setCourses(defaultPlan)}
								className="text-sm font-semibold px-3 py-2 rounded-lg border border-indigo-200 text-blue-700 hover:bg-indigo-100"
							>
								Reset to default plan
							</button>
						</div>
						{totalCourses > 0 && (
							<div className="flex items-center gap-6 flex-wrap pt-3 border-t border-slate-200 text-sm text-slate-800 font-semibold">
								<span>
									Total Courses:{" "}
									<span className="text-indigo-600">{totalCourses}</span>
								</span>
								<span>
									Total Credits:{" "}
									<span className="text-indigo-600">{totalCredits}</span>
								</span>
							</div>
						)}
					</div>

					{Object.keys(groupedCourses).length === 0 && (
						<div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 text-sm text-slate-500 text-center">
							Add courses from the catalogue to build your plan.
						</div>
					)}

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

				<div
					className="bg-white border border-slate-200 rounded-xl shadow-sm mt-11 p-5 space-y-4 sticky top-4 self-start"
					style={{ height: "calc(90vh - 130px)" }}
				>
					<div className="flex items-center justify-between">
						<h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
							Course catalogue
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
						{availableCourses.length === 0 && (
							<p className="text-slate-500 text-sm">
								Select a program to view suggested courses.
							</p>
						)}
						{availableCourses.map((course) => (
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
		</section>
	);
};

export default EducationPlanEditor;
