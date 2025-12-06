import { Fragment, useEffect, useMemo, useState } from "react";
import { getEducationPlanList } from "../../services/authService.js";
import { listPrograms } from "../../services/educationPlanService.js";
import { load as loadStorage } from "../../utils/storage.js";

const normalizeRequirement = (value) => (value || "").trim();
const hasMeaningfulRequirement = (value) => {
	const normalized = normalizeRequirement(value).toLowerCase();
	return normalized && normalized !== "none" && normalized !== "n/a";
};

const CourseMeta = ({ course }) => {
	const prereqText = normalizeRequirement(course.prerequisite);
	const coreqText = normalizeRequirement(course.corequisite);
	const showPrereq = hasMeaningfulRequirement(prereqText);
	const showCoreq = hasMeaningfulRequirement(coreqText);

	return (
		<div className="text-xs text-slate-600 flex flex-wrap items-center gap-x-4 gap-y-1">
			<span className="inline-flex items-center gap-1 whitespace-nowrap">
				<span className="text-slate-500">Code:</span>
				<span className="font-medium text-slate-800">{course.code}</span>
			</span>
			<span className="inline-flex items-center gap-1 whitespace-nowrap">
				<span className="text-slate-500">Credits:</span>
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
			{showCoreq && (
				<span className="inline-flex items-center gap-1 whitespace-nowrap">
					<span className="text-sky-700">Corequisite:</span>
					<span className="text-yellow-500 font-medium">{coreqText}</span>
				</span>
			)}
		</div>
	);
};

const ViewEducationPlan = () => {
	const [savedPlans, setSavedPlans] = useState([]);
	const [programCatalogue, setProgramCatalogue] = useState([]);
	const [filter, setFilter] = useState("");
	const [error, setError] = useState("");
	const [expandedPlanId, setExpandedPlanId] = useState(null);
	const userEmail = loadStorage("UserEmail");

	const filteredPlans = useMemo(() => {
		if (!filter.trim()) return savedPlans;
		const term = filter.toLowerCase();
		return savedPlans.filter(
			(plan) =>
				plan.program?.toLowerCase().includes(term) ||
				plan.university?.toLowerCase().includes(term)
		);
	}, [savedPlans, filter]);

	const loadLocalPlans = () => {
		const stored = loadStorage("LocalSavedPlans", []);
		return stored.map((entry, index) => ({
			id: `local-${index}`,
			university: entry.university || "University",
			program: entry.program || "Program",
			savedDate: entry.savedDate || new Date().toISOString(),
			courses: entry.courses || [],
			averageAnnualCost: entry.averageAnnualCost || "",
			source: "local",
		}));
	};

	const loadPlans = async () => {
		const localPlans = loadLocalPlans();
		if (!userEmail) {
			setSavedPlans(localPlans);
			return;
		}
		setError("");
		try {
			const response = await getEducationPlanList({ email: userEmail });
			const payload = response.data?.data || [];

			const remotePlans = payload.map((entry, index) => ({
				id: `remote-${index}`,
				university: entry.university || entry.university_name || "University",
				program: entry.program_name || entry.programTitle || "Program",
				savedDate:
					entry.created_at || entry.savedDate || new Date().toISOString(),
				courses: entry.program || [],
				averageAnnualCost:
					entry.average_annual_cost ||
					entry.averageAnnualCost ||
					entry.college_profile?.average_annual_cost ||
					"",
				source: "remote",
			}));

			setSavedPlans([...remotePlans, ...localPlans]);
		} catch (err) {
			console.error(err);
			if (err.response?.status === 401) {
				setError(
					"Your session has expired. Please login again to view saved plans."
				);
			} else {
				setError("Unable to fetch education plans at the moment.");
			}
			setSavedPlans(localPlans);
		}
	};

	useEffect(() => {
		loadPlans();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [userEmail]);

useEffect(() => {
		listPrograms()
			.then((items) => setProgramCatalogue(items))
			.catch((err) => console.error("Unable to load program catalogue", err));
	}, []);

	const formatDate = (dateString) => {
		try {
			const date = new Date(dateString);
			return date.toLocaleDateString("en-US", {
				year: "numeric",
				month: "short",
				day: "numeric",
			});
		} catch {
			return "N/A";
		}
	};

	const getTotalCredits = (courses) => {
		return courses.reduce((sum, course) => {
			const value = Number(course.credits);
			return sum + (Number.isFinite(value) ? value : 0);
		}, 0);
	};

	const groupCoursesByYearAndSemester = (courses) => {
		return courses.reduce((acc, course) => {
			const year = course.year || "Year 1";
			const semester = course.semester || "Semester 1";
			acc[year] = acc[year] || {};
			acc[year][semester] = acc[year][semester] || [];
			acc[year][semester].push(course);
			return acc;
		}, {});
	};

	const findAverageAnnualCost = (plan) => {
		if (!plan.university || !plan.program) return null;
		const match = programCatalogue.find(
			(entry) =>
				String(entry.university).toLowerCase() ===
					String(plan.university).toLowerCase() &&
				String(entry.program).toLowerCase() ===
					String(plan.program).toLowerCase()
		);
		return (
			plan.average_annual_cost ||
			plan.averageAnnualCost ||
			match?.average_annual_cost ||
			match?.averageAnnualCost ||
			match?.college_profile?.average_annual_cost ||
			null
		);
	};

	const toggleExpand = (planId) => {
		setExpandedPlanId((prev) => (prev === planId ? null : planId));
	};

	return (
		<section className="space-y-6">
			<header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
				<div>
					<h2 className="text-2xl font-semibold text-slate-900">
						Saved Education Plans
					</h2>
					<p className="text-sm text-slate-500">
						Browse and share the education plans you&apos;ve saved.
					</p>
				</div>
			</header>

			<div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 space-y-4">
				<div className="flex items-center gap-4 flex-wrap">
					<label className="text-sm font-medium text-slate-700">Filter:</label>
					<input
						value={filter}
						onChange={(event) => setFilter(event.target.value)}
						className="flex-1 min-w-[200px] px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
						placeholder="Filter by program or university"
					/>
				</div>

				{error && (
					<div className="bg-rose-50 text-rose-700 border border-rose-100 rounded-lg px-4 py-3">
						{error}
					</div>
				)}

				{/* Plans Summary Table */}
				<div className="overflow-x-auto">
					<table className="min-w-full text-sm table-auto">
						<thead>
							<tr className="text-left text-xs uppercase tracking-wide text-slate-500 border-b border-slate-200 bg-slate-50">
								<th className="px-4 py-3 font-semibold text-center">No.</th>
								<th className="px-4 py-3 font-semibold">University</th>
								<th className="px-4 py-3 font-semibold">Program</th>
								<th className="px-4 py-3 font-semibold">Total Credits</th>
								<th className="px-4 py-3 font-semibold">Courses</th>
								<th className="px-4 py-3 font-semibold">Date Saved</th>
								<th className="px-4 py-3 font-semibold text-center">Actions</th>
							</tr>
						</thead>
						<tbody>
							{filteredPlans.map((plan, index) => (
								<Fragment key={plan.id}>
									<tr className="border-b border-slate-100 hover:bg-slate-50 transition">
										<td className="px-4 py-3 text-center text-slate-700 font-semibold w">
											{index + 1}
										</td>
										<td className="px-4 py-3 text-slate-800 font-medium">
											{plan.university}
										</td>
										<td className="px-4 py-3 text-slate-700">{plan.program}</td>
										<td className="px-4 py-3 text-slate-700">
											<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
												{getTotalCredits(plan.courses)} credits
											</span>
										</td>
										<td className="px-4 py-3 text-slate-700">
											<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
												{plan.courses.length} courses
											</span>
										</td>
										<td className="px-4 py-3 text-slate-600">
											{formatDate(plan.savedDate)}
										</td>
										<td className="px-4 py-3 text-center">
											<div className="flex items-center justify-center gap-2">
												<button
													type="button"
													onClick={() => toggleExpand(plan.id)}
													className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
														expandedPlanId === plan.id
															? "bg-indigo-600 text-white"
															: "bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
													}`}
												>
													{expandedPlanId === plan.id ? "Hide" : "View"}
												</button>
												<button
													type="button"
													className="px-4 py-1.5 rounded-lg bg-emerald-100 text-emerald-700 text-sm font-medium hover:bg-emerald-200 transition"
												>
													Send to Advisor
												</button>
											</div>
										</td>
									</tr>

									{/* Expanded Plan Details */}
									{expandedPlanId === plan.id && (
										<tr key={`${plan.id}-details`}>
											<td colSpan={7} className="p-0">
												<div className="bg-slate-50 border-t border-slate-200 p-6">
													<div className="mb-4 flex items-center justify-between">
														<h3 className="text-lg font-semibold text-slate-800">
															{plan.program} - {plan.university}
														</h3>
														<div className="flex items-center gap-4 text-sm">
															<span className="text-slate-600">
																Avg Annual Cost:{" "}
																<span className="font-bold text-emerald-700">
																	{findAverageAnnualCost(plan) || "N/A"}
																</span>
															</span>
															<span className="text-slate-600">
																Total Credits:{" "}
																<span className="font-bold text-indigo-600">
																	{getTotalCredits(plan.courses)}
																</span>
															</span>
															<span className="text-slate-600">
																Total Courses:{" "}
																<span className="font-bold text-indigo-600">
																	{plan.courses.length}
																</span>
															</span>
														</div>
													</div>

													<div className="space-y-6">
														{Object.entries(
															groupCoursesByYearAndSemester(plan.courses)
														).map(([year, semesters]) => (
															<div key={year} className="space-y-4">
																<h4 className="text-md font-semibold text-slate-700 border-b border-slate-200 pb-2">
																	{year}
																</h4>
																<div className="grid gap-4 md:grid-cols-2">
																	{Object.entries(semesters).map(
																		([semester, courses]) => (
																			<div
																				key={semester}
																				className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 space-y-3"
																			>
																				<h5 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
																					{semester}
																				</h5>
																				<ul className="space-y-2 text-sm text-slate-700">
																					{courses.map((course) => (
																						<li
																							key={course.code}
																							className="border border-slate-100 rounded-lg p-3 flex flex-col gap-1 hover:border-indigo-200 hover:bg-indigo-50/50 transition"
																						>
																							<span className="font-semibold text-slate-800">
																								{course.courseName ||
																									course.name}
																							</span>
																							<CourseMeta course={course} />
																						</li>
																					))}
																				</ul>
																			</div>
																		)
																	)}
																</div>
															</div>
														))}
													</div>
												</div>
											</td>
										</tr>
									)}
								</Fragment>
							))}
							{filteredPlans.length === 0 && (
								<tr>
									<td
										colSpan={7}
										className="px-4 py-8 text-center text-slate-500"
									>
										<div className="flex flex-col items-center gap-2">
											<svg
												className="w-12 h-12 text-slate-300"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth={1.5}
													d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
												/>
											</svg>
											<span>
												No plans found. Save an education plan to see it here.
											</span>
										</div>
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			</div>
		</section>
	);
};

export default ViewEducationPlan;
