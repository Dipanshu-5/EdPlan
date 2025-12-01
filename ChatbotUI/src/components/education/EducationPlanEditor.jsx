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

	// When programs change, compute global available courses (all subjects)
	useEffect(() => {
		const globalCourses = programs.flatMap(
			(match) =>
				(match.years || []).flatMap((entry) =>
					(entry.semesters || []).flatMap((s) =>
						(s.courses || []).map((course) => ({
							program: match.program,
							university: match.university,
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
				) || []
		);
		if (!selectedProgram) {
			setAvailableCourses(globalCourses);
		}
	}, [programs, selectedProgram]);

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
			if (prev.some((item) => item.code === course.code)) {
				alert("Course already in your plan.");
				return prev;
			}
			return [
				...prev,
				{
					program: selectedProgram,
					university: selectedUniversity,
					year: year || course.year,
					semester: course.semester,
					courseName: course.name,
					code: course.code,
					credits: course.credits,
					prerequisite: course.prerequisite,
					corequisite: course.corequisite,
					schedule: course.schedule,
				},
			];
		});
	};

	const removeCourse = (code) => {
		setCourses((prev) => prev.filter((course) => course.code !== code));
	};

	const savePlanLocally = () => {
		if (!selectedUniversity || !selectedProgram) {
			alert("Select a university and program before saving.");
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
	const creditsByYear = useMemo(() => {
		return courses.reduce((acc, course) => {
			const yr = course.year || "Year";
			const value = Number(course.credits);
			acc[yr] = (acc[yr] || 0) + (Number.isFinite(value) ? value : 0);
			return acc;
		}, {});
	}, [courses]);

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
					<h3 className="text-lg font-semibold text-slate-800">
						My Education Plan
					</h3>

					<div className="flex flex-wrap items-center gap-2">
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
						<div className="flex items-center gap-2">
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
					</div>

					{totalCourses > 0 && (
						<div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 mt-4 text-sm text-slate-800 font-bold flex flex-col gap-2">							
							<div className="flex items-center gap-4 flex-wrap">
							<span>Total Courses: {totalCourses}</span>
							<span>Total Credits: {totalCredits}</span>
							</div>

							<div className="flex items-center gap-4 flex-wrap">
							{Object.entries(creditsByYear).map(([yr, credits]) => (
								<span key={yr} className="text-sm font-normal text-slate-800">
								{yr}: {credits} credits
								</span>
							))}
							</div>
						</div>
					)}

					{Object.keys(groupedCourses).length === 0 && (
						<div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 text-sm text-slate-500">
							Add courses from the catalogue to build your plan.
						</div>
					)}

					{Object.entries(groupedCourses).map(([groupKey, courseList]) => {
						const [courseYear, courseSemester] = groupKey.split("::");
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
											className="border border-slate-100 rounded-lg p-3 flex flex-col gap-1 hover:border-indigo-200 hover:bg-indigo-50"
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
															<span className="text-sky-700">Pre-requisite:</span>
															<span
																className={
																	showPrereq ? "text-orange-500 font-medium" : "text-slate-500"
																}
															>
																{prereqText || "N/A"}
															</span>
														</span>
														<span className="inline-flex items-center gap-1 whitespace-nowrap">
															<span className="text-sky-700">Corequisite:</span>
															<span
																className={
																	showCoreq ? "text-yellow-500 font-medium" : "text-slate-500"
																}
															>
																{coreqText || "N/A"}
															</span>
														</span>
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

				<div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 mt-11 space-y-4 w-fit h-fit">
					<div className="flex items-center justify-between">
						<h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
							Course catalogue
						</h3>
						<button
							type="button"
							onClick={savePlan}
							className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500"
						>
							Save Plan
						</button>
					</div>
					<div className="max-h-[520px] overflow-y-auto space-y-3 text-sm">
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
										<span className="text-md font-bold text-blue-700 mt-2">Add</span>
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
