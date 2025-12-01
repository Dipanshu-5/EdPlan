import { useEffect, useMemo, useState } from "react";
import { searchUniversities } from "../../services/universityService.js";
import { save as saveStorage } from "../../utils/storage.js";
import { useNavigate } from 'react-router-dom';

const stateOptions = [
	"",
	"AL",
	"AK",
	"AZ",
	"AR",
	"CA",
	"CO",
	"CT",
	"DE",
	"FL",
	"GA",
	"HI",
	"ID",
	"IL",
	"IN",
	"IA",
	"KS",
	"KY",
	"LA",
	"ME",
	"MD",
	"MA",
	"MI",
	"MN",
	"MS",
	"MO",
	"MT",
	"NE",
	"NV",
	"NH",
	"NJ",
	"NM",
	"NY",
	"NC",
	"ND",
	"OH",
	"OK",
	"OR",
	"PA",
	"RI",
	"SC",
	"SD",
	"TN",
	"TX",
	"UT",
	"VT",
	"VA",
	"WA",
	"WV",
	"WI",
	"WY",
];

const formatPercent = (value) =>
	value || value === 0 ? `${Math.round(value * 100)}%` : "N/A";
const formatCurrency = (value) =>
	value || value === 0 ? `$${Number(value).toLocaleString()}` : "N/A";

const FindUniversity = ({ onSelectProgram }) => {
	const [universities, setUniversities] = useState([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [searchTerm, setSearchTerm] = useState("");
	const [stateFilter, setStateFilter] = useState("");
	const [costFilter, setCostFilter] = useState(50000);
	const navigate = useNavigate();

	const fetchUniversities = async (overrides = {}) => {
		setLoading(true);
		setError("");
		try {
			const payload = await searchUniversities({
				search: overrides.search ?? searchTerm,
				state: overrides.state ?? stateFilter,
				perPage: 16,
			});
			setUniversities(payload.data || []);
		} catch (err) {
			console.error(err);
			setError("Unable to load data from College Scorecard.");
			setTimeout(() => {
				setError("");
			}, 1000);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		setStateFilter("NM");
		fetchUniversities({ state: "NM" });
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const filteredUniversities = useMemo(() => {
		return universities.filter((university) => {
			const matchesCost =
				!university.average_annual_cost ||
				Number(university.average_annual_cost || 0) <= Number(costFilter);
			return matchesCost;
		});
	}, [universities, costFilter]);

	const handleSelect = (university) => {
		saveStorage("University", university.name);
		saveStorage("UniversityUnitId", university.unit_id);
		saveStorage("UniversityState", university.state);
		saveStorage("Programname", university.name);
		saveStorage("Programnameview", university.name);
		saveStorage("universityview", university.name);
		saveStorage("selectedComponent", "program");
		if (onSelectProgram) {
			onSelectProgram(university);
		}
	};

	const handleSearch = (event) => {
		event.preventDefault();
		fetchUniversities({ search: searchTerm, state: stateFilter });
	};

	return (
		<section className="space-y-6">
			<header className="flex flex-col gap-4">
			    <h2 className="text-2xl font-semibold text-slate-900">Explore colleges</h2>
				<form
					onSubmit={handleSearch}
					className="flex flex-col md:flex-row gap-3"
				>
					<input
						value={searchTerm}
						onChange={(event) => setSearchTerm(event.target.value)}
						className="px-4 py-2 rounded-lg border border-slate-200 md:w-[500px] text-center"
						placeholder="Search by University Name or City"
					/>
					<select
						value={stateFilter}
						onChange={(event) => setStateFilter(event.target.value)}
						className="px-3 py-2 rounded-lg border border-slate-200 md:w-[400px]"
					>
						{stateOptions.map((state) => (
							<option key={state || "all"} value={state}>
								{state ? state : "All states"}
							</option>
						))}
					</select>
					<button
						type="submit"
						className="px-4 py-2 rounded-lg bg-slate-900 text-white font-medium hover:bg-slate-700 md:w-[300px]"
						disabled={loading}
					>
						Search
					</button>
				</form>
			</header>

			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				<label className="flex flex-col gap-1 text-sm text-slate-600 font-semibold">
					Max annual cost
					<input
						type="range"
						min="10000"
						max="100000"
						step="1000"
						value={costFilter}
						onChange={(event) => setCostFilter(Number(event.target.value))}
						className="accent-indigo-600"
					/>
					<span className="text-xs text-slate-500">
						${costFilter.toLocaleString()}
					</span>
				</label>
			</div>

			{error && (
				<div className="bg-rose-50 text-rose-700 border border-rose-100 rounded-lg px-4 py-3">
					{error}
				</div>
			)}

			{loading ? (
				<div className="text-sm text-slate-500">Loading data…</div>
			) : (
				<div className="grid gap-4 md:grid-cols-2">
					{filteredUniversities.map((university) => {
						const websiteUrl = university.website
							? university.website.startsWith("http")
								? university.website
								: `https://${university.website}`
							: null;
						return (
							<article
								key={university.unit_id}
								className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 flex flex-col gap-3 hover:shadow-lg transition"
							>
								<div className="flex items-start justify-between gap-3">
									<div>
										<h3 className="text-xl font-semibold text-slate-900">
											{university.name}
										</h3>
										<p className="text-sm text-slate-500">
											{university.city}, {university.state} ·{" "}
											{university.organization_type}
										</p>
									</div>
									<span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
										{university.location_type}
									</span>
								</div>
								<ul className="text-sm text-slate-600 space-y-2">
									<li>
										Size:{" "}
										{university.size ? university.size.toLocaleString() : "N/A"}{" "}
										students
									</li>
									<li>
										Graduation Rate:{" "}
										{university.graduation_rate
											? `${Math.round(university.graduation_rate * 100)}%`
											: "N/A"}
									</li>
									<li>
										Average Annual Cost:{" "}
										{university.average_annual_cost
											? `$${Number(
													university.average_annual_cost
											  ).toLocaleString()}`
											: "N/A"}
									</li>
									<li>
										Median Earnings: {formatCurrency(university.typical_earnings)}
									</li>
									<li>
										Acceptance Rate:{" "}
										{university.acceptance_rate ? formatPercent(university.acceptance_rate): "100%"}
									</li>
									<li>
										Median Total Debt After Graduation:{" "}
										{formatCurrency(university.financial_aid_debt) ||
										"Data unavailable"}
									</li>
								</ul>
								{websiteUrl && (
									<a
										href={websiteUrl}
										target="_blank"
										rel="noreferrer"
										className="text-sm text-indigo-600 hover:text-indigo-500"
									>
										Visit Website
									</a>
								)}
								<button
									type="button"
									onClick={() => {
										handleSelect(university);
										navigate("/educationplan");
									}}
									className="self-start px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-700"
								>
									Create Education Plan
								</button>
							</article>
						);
					})}
					{filteredUniversities.length === 0 && (
						<div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 text-sm text-slate-500">
							No universities found with the current filters.
						</div>
					)}
				</div>
			)}
		</section>
	);
};

export default FindUniversity;
