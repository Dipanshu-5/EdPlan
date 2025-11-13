import { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
	addEducationPlan,
	getEducationPlan,
} from "../../services/authService.js";
import { listPrograms } from "../../services/educationPlanService.js";
import { searchUniversities } from "../../services/universityService.js";
import {
	load as loadStorage,
	save as saveStorage,
} from "../../utils/storage.js";

const LOCAL_PLAN_KEY = "LocalSavedPlans";
const defaultSemesters = ["Fall", "Spring", "Summer"];

const EducationPlanEditor = () => {
	const [programs, setPrograms] = useState([]);
	const [selectedProgram, setSelectedProgram] = useState(
		loadStorage("Programname") || ""
	);
	const [selectedUniversity, setSelectedUniversity] = useState(
		loadStorage("University") || ""
	);
	const [searchQuery, setSearchQuery] = useState("");
	const [searchResults, setSearchResults] = useState([]);
	const [isSearching, setIsSearching] = useState(false);
	const [showUniversityDropdown, setShowUniversityDropdown] = useState(false);
	const [year, setYear] = useState("");
	const [semester, setSemester] = useState("");
	const [courses, setCourses] = useState([]);
	const [availableCourses, setAvailableCourses] = useState([]);
	const [error, setError] = useState("");
	const userEmail = loadStorage("UserEmail");
	const searchInputRef = useRef(null);
	const navigate = useNavigate();
	const dropdownRef = useRef(null);

	useEffect(() => {
		listPrograms()
			.then((items) => setPrograms(items))
			.catch((err) => {
				console.error(err);
				setError("Unable to load program catalogue.");
			});
	}, []);

	useEffect(() => {
		if (!searchQuery.trim()) {
			setSearchResults([]);
			return;
		}

		const delayDebounceFn = setTimeout(async () => {
			setIsSearching(true);
			try {
				const response = await searchUniversities({
					search: searchQuery,
					perPage: 10,
				});
				const results = response.data || [];
				setSearchResults(results);
			} catch (err) {
				console.error("Error searching universities:", err);
				setSearchResults([]);
			} finally {
				setIsSearching(false);
			}
		}, 300);

		return () => clearTimeout(delayDebounceFn);
	}, [searchQuery]);

	useEffect(() => {
		const handleClickOutside = (e) => {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(e.target) &&
				searchInputRef.current &&
				!searchInputRef.current.contains(e.target)
			) {
				setShowUniversityDropdown(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
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
		// If no program is selected, show all subjects in the catalogue
		if (!selectedProgram) {
			setAvailableCourses(globalCourses);
		}
	}, [programs, selectedProgram]);

	// Update availableCourses when a program + university is selected, but do NOT auto-fill the user's plan
	useEffect(() => {
		if (!selectedProgram || !selectedUniversity) {
			setAvailableCourses((prev) => prev || []);
			setCourses([]); // ensure plan starts empty by default
			return;
		}

		const match = programs.find(
			(program) =>
				program.program === selectedProgram &&
				program.university === selectedUniversity
		);
		if (!match) {
			setAvailableCourses([]);
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
		// start with an empty plan — user will add courses manually
		setCourses([]);
	}, [programs, selectedProgram, selectedUniversity]);

	const filteredAvailableCourses = useMemo(() => {
		if (!year || !semester) return availableCourses;
		return availableCourses.filter(
			(course) => course.year === year && course.semester === semester
		);
	}, [availableCourses, semester, year]);

	const groupedCourses = useMemo(() => {
		return courses.reduce((acc, course) => {
			const key = `${course.year}::${course.semester}`;
			acc[key] = acc[key] || [];
			acc[key].push(course);
			return acc;
		}, {});
	}, [courses]);

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
					semester: semester || course.semester,
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

	return (
		<section className="space-y-6">
			<h2 className="text-2xl font-semibold text-slate-900">
				Customize Your Education Plan
			</h2>
			<header className="grid gap-4 md:grid-cols-2 bg-white border border-slate-200 rounded-xl shadow-sm p-5">
				<label className="flex flex-col gap-2 text-sm font-semibold text-slate-600">
					University
					<div className="relative">
						<input
							ref={searchInputRef}
							type="text"
							placeholder="Search universities..."
							value={searchQuery}
							onChange={(e) => {
								setSearchQuery(e.target.value);
								setShowUniversityDropdown(true);
							}}
							onFocus={() => setShowUniversityDropdown(true)}
							className="w-full px-3 py-2 rounded-lg font-normal border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
						/>

						{showUniversityDropdown &&
							(searchResults.length > 0 || searchQuery.trim()) && (
								<div
									ref={dropdownRef}
									className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto"
								>
									{isSearching && (
										<div className="px-4 py-3 text-slate-500 text-sm">
											Searching...
										</div>
									)}
									{!isSearching &&
										searchResults.length === 0 &&
										searchQuery.trim() && (
											<div className="px-4 py-3 text-slate-500 text-sm">
												No universities found
											</div>
										)}
									{searchResults.map((university) => (
										<button
											key={university.id || university.name}
											type="button"
											className="w-full text-left px-4 py-3 hover:bg-indigo-50 transition border-b border-slate-100 last:border-b-0"
											onClick={() => {
												setSelectedUniversity(university.name || university);
												saveStorage(
													"University",
													university.name || university
												);
												setSearchQuery("");
												setShowUniversityDropdown(false);
											}}
										>
											<div className="font-medium text-slate-800">
												{university.name || university}
											</div>
											{university.state && (
												<div className="text-xs text-slate-500">
													{university.state}
												</div>
											)}
										</button>
									))}
								</div>
							)}
					</div>
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
						{programs.map((program) => (
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

			{selectedUniversity && (
				<div className="mt-2 px-3 py-2 bg-indigo-50 border border-indigo-200 rounded-lg text-sm text-indigo-700">
					Selected: <strong>{selectedUniversity}</strong>
				</div>
			)}

			{error && (
				<div className="bg-rose-50 text-rose-700 border border-rose-100 rounded-lg px-4 py-3">
					{error}
				</div>
			)}

			<div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
				<div className="space-y-4">
					<h3 className="text-lg font-semibold text-slate-800">
						My Education Plan
					</h3>
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
											className="border border-slate-100 rounded-lg p-3 flex flex-col gap-1"
										>
											<div className="flex items-center justify-between gap-2">
												<span className="font-medium text-slate-800">
													{course.courseName}
												</span>
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
												<span>Credits: {course.credits ?? "N/A"}</span>
												{course.prerequisite && (
													<span>Prereq: {course.prerequisite}</span>
												)}
											</div>
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
							Save changes
						</button>
					</div>
					<div className="max-h-[520px] overflow-y-auto space-y-3 text-sm">
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
