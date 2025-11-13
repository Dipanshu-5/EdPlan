import { useEffect, useMemo, useState } from "react";
import { getEducationPlanList } from "../../services/authService.js";
import { load as loadStorage } from "../../utils/storage.js";

const columns = ["university", "program", "courseName", "code", "year"];

const ViewEducationPlan = () => {
	const [plans, setPlans] = useState([]);
	const [filter, setFilter] = useState("");
	const [error, setError] = useState("");
	const userEmail = loadStorage("UserEmail");

	const filteredPlans = useMemo(() => {
		if (!filter.trim()) return plans;
		const term = filter.toLowerCase();
		return plans.filter(
			(row) =>
				row.program?.toLowerCase().includes(term) ||
				row.university?.toLowerCase().includes(term) ||
				row.year?.toLowerCase().includes(term) ||
				row.semester?.toLowerCase().includes(term) ||
				row.code?.toLowerCase().includes(term) ||
				row.courseName?.toLowerCase().includes(term)
		);
	}, [plans, filter]);

	const flattenPrograms = (entries = []) =>
		entries.flatMap((entry) =>
			(entry.program || []).map((course) => ({
				...course,
				program: course.program || entry.program_name || entry.programTitle || "Program",
				university:
					course.university || entry.university || entry.university_name || "University",
			}))
		);

	const loadLocalPlans = () => {
		const stored = loadStorage("LocalSavedPlans", []);
		return flattenPrograms(
			stored.map((entry) => ({
				program: entry.courses || [],
				program_name: entry.program,
				university: entry.university,
			}))
		);
	};

	const loadPlans = async () => {
		const localPlans = loadLocalPlans();
		if (!userEmail) {
			setPlans(localPlans);
			return;
		}
		setError("");
		try {
			const response = await getEducationPlanList({ email: userEmail });
			const payload = response.data?.data || [];
			const remotePlans = flattenPrograms(payload);
			setPlans([...remotePlans, ...localPlans]);
		} catch (err) {
			console.error(err);
			if (err.response?.status === 401) {
				setError(
					"Your session has expired. Please login again to view saved plans."
				);
			} else {
				setError("Unable to fetch education plans at the moment.");
			}
			setPlans(localPlans);
		}
	};

	useEffect(() => {
		loadPlans();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [userEmail]);

	return (
		<section className="space-y-6">
			<header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
				<div>
					<h2 className="text-2xl font-semibold text-slate-900">
						Saved education plans
					</h2>
					<p className="text-sm text-slate-500">
						Browse and share the education plans you&apos;ve saved.
					</p>
				</div>
			</header>

			<div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 space-y-4">
				<div className="flex items-center justify-between gap-4 flex-wrap">
					<label>Filter:</label>
					<input
						value={filter}
						onChange={(event) => setFilter(event.target.value)}
						className="flex-1 min-w-[200px] px-3 py-2 rounded-lg border border-slate-200"
						placeholder="Filter by program, course, or year"
					/>
				</div>

				{error && (
					<div className="bg-rose-50 text-rose-700 border border-rose-100 rounded-lg px-4 py-3">
						{error}
					</div>
				)}

				<div className="overflow-x-auto">
					<table className="min-w-full text-sm">
						<thead>
							<tr className="text-left text-xs uppercase tracking-wide text-slate-500 border-b border-slate-100">
								{columns.map((column) => (
									<th key={column} className="px-3 py-2 font-semibold">
									    {column === "courseName" ? "Course Name" : column.charAt(0).toUpperCase() + column.slice(1)}
										
									</th>
								))}
							</tr>
						</thead>
						<tbody>
							{filteredPlans.map((row, index) => (
								<tr
									key={`${row.code}-${index}`}
									className="border-b border-slate-100 hover:bg-slate-50 transition"
								>
									{columns.map((column) => (
										<td key={column} className="px-3 py-2 text-slate-700">
											{row[column]}
										</td>
									))}
								</tr>
							))}
							{filteredPlans.length === 0 && (
								<tr>
									<td
										colSpan={columns.length}
										className="px-3 py-6 text-center text-slate-500"
									>
										No plans found. Save an education plan to see it here.
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
				<button
					type="button"
					className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500"
				>
					Send To Advisor
				</button>
			</div>
		</section>
	);
};

export default ViewEducationPlan;
