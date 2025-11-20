import { useEffect, useMemo, useState } from "react";
import {
	searchUniversities,
	compareUniversitiesByIds,
} from "../../services/universityService.js";

const dataNotAvailable = "N/A";

const formatPercent = (value) =>
	value || value === 0 ? `${(value * 100).toFixed(1).replace(/\.0$/, "")} %` : "N/A";
const formatCurrency = (value) =>
	value || value === 0 ? `$ ${Number(value).toLocaleString()}` : "N/A";
const formatNumber = (value) =>
	value || value === 0 ? Number(value).toLocaleString() : "N/A";
const formatRatio = (value) =>
	value || value === 0 ? `${Number(value).toFixed(0)} : 1` : "N/A";
const formatWebsite = (value) =>
	value ? (
		<a
			href={value.startsWith("http") ? value : `https://${value}`}
			target="_blank"
			rel="noreferrer"
			className="text-indigo-600 hover:text-indigo-500"
		>
			Visit Website
		</a>
	) : (
		"N/A"
	);

const overviewMetrics = [
	{ key: "city", label: "City" },
	{ key: "state", label: "State" },
	{ key: "size", label: "Students Size", format: formatNumber },
	{ key: "organization_type", label: "Organization Type" },
	{ key: "location_type", label: "Campus Location" },
	{ key: "website", label: "College Website Link", format: formatWebsite },
];

const admissionsMetrics = [
	{ key: "graduation_rate", label: "Graduation Rate", format: formatPercent },
	{ key: "acceptance_rate", label: "Acceptance Rate", format: formatPercent },
	{
		key: "first_year_return_rate",
		label: "Students Returning After First Year (Retention Rate)",
		format: formatPercent,
	},
	{ key: "test_score", label: "SAT Score (Critical Reading)", format: formatNumber },
	{ key: "act_score", label: "ACT Score", format: formatNumber },
	{ key: "student_faculty_ratio", label: "Student to Faculty Ratio", format: formatRatio },
];

const enrollmentMetrics = [
	{ key: "size", label: "Total Undergraduate Students", format: formatNumber },
	{ key: "full_time_enrollment", label: "Full-time Students", format: formatNumber },
	{ key: "part_time_enrollment", label: "Part-time Students", format: formatNumber },
];

const outcomeMetrics = [
	{ key: "average_annual_cost", label: "Average Annual Cost", format: formatCurrency },
	{ key: "median_earnings", label: "Median Earnings", format: formatCurrency },
];

const financialMetrics = [
	{ key: "median_debt", label: "Median Total Debt After Graduation", format: formatCurrency },
	{
		key: "typical_monthly_payment",
		label: "Typical Monthly Loan Payment",
		format: formatCurrency,
	},
	{
		key: "federal_loan_rate",
		label: "Students Receiving Federal Loans",
		format: formatPercent,
	},
	{ key: "repayment_rate", label: "Repayment Rate", format: formatPercent },
	{
		key: "percent_more_than_hs",
		label: "Percentage Earning More Than HS Graduate",
		format: formatPercent,
	},
];

const studentLifeMetrics = [
	{
		label: "Housing Prices",
		key: "housing_prices",
		format: () => dataNotAvailable,
	},
	{
		label: "Food",
		key: "food",
		format: () => dataNotAvailable,
	},
	{
		label: "Transportation",
		key: "transportation",
		format: () => dataNotAvailable,
	},
	{
		label: "Miscellaneous Expenses",
		key: "misc_expenses",
		format: () => dataNotAvailable,
	},
	{
		label: "Crime Rate",
		key: "crime_rate",
		format: () => dataNotAvailable,
	},
	{
		label: "Faculty with PhD",
		key: "faculty_with_phd",
		format: () => dataNotAvailable,
	},
];

const courseInsightMetrics = [
	{
		label: "Field of Study",
		key: "field_of_study",
		format: () => "Browse Find University to explore programs.",
	},
	{
		label: "Course Code",
		key: "course_code",
		format: () => "Use the Education Plan builder to view course codes.",
	},
	{
		label: "Course Name",
		key: "course_name",
		format: () => "Use the Education Plan builder to view course names.",
	},
	{
		label: "Lecture Hours",
		key: "lecture_hours",
		format: () => "Detailed schedule data lives inside Education Plan.",
	},
	{
		label: "Lab Hours",
		key: "lab_hours",
		format: () => "Detailed schedule data lives inside Education Plan.",
	},
	{
		label: "Credit Hours",
		key: "credit_hours",
		format: () => "Check each saved plan for credit breakdown.",
	},
	{
		label: "Pre-requisites",
		key: "pre_requisites",
		format: () => "View prerequisites inside Education Plan courses.",
	},
	{
		label: "Co-requisites",
		key: "co_requisites",
		format: () => "View co-requisites inside Education Plan courses.",
	},
];

const socioRows = [
	{ key: "first_generation_share", label: "First-generation students" },
	{ key: "pell_grant_rate", label: "Students receiving Pell Grants" },
];

const raceRows = [
	{ key: "white", label: "White" },
	{ key: "black", label: "Black or African American" },
	{ key: "hispanic", label: "Hispanic/Latino" },
	{ key: "asian", label: "Asian" },
	{ key: "two_or_more", label: "Two or more races" },
	{ key: "non_resident", label: "Non-resident alien" },
];

const familyIncomeBrackets = [
	{ key: "0-30000", label: "$0 – $30k" },
	{ key: "30001-48000", label: "$30k – $48k" },
	{ key: "48001-75000", label: "$48k – $75k" },
	{ key: "75001-110000", label: "$75k – $110k" },
	{ key: "110001-plus", label: "$110k+" },
];

const SectionCard = ({ title, children, note }) => (
	<div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 space-y-3">
		<div>
			<h3 className="text-base font-bold text-slate-700">{title}</h3>
			{note && <p className="text-xs text-slate-500">{note}</p>}
		</div>
		{children}
	</div>
);

const ComparisonTable = ({ title, metrics, schools, note }) => (
	<SectionCard title={title} note={note}>
		<div className="overflow-x-auto">
			<table className="min-w-full text-sm">
				<thead>
					<tr className="text-sm uppercase tracking-wide text-slate-600">
						<th className="text-left px-3 py-2 font-bold">Metric</th>
						{schools.map((school) => (
							<th key={school.unit_id || school.name} className="text-left px-3 py-2 font-bold">
								{school.name || "Selected college"}
							</th>
						))}
					</tr>
				</thead>
				<tbody>
					{metrics.map((metric) => (
						<tr key={metric.key || metric.label} className="border-t border-slate-100">
							<td className="px-3 py-2 font-medium text-slate-700">{metric.label}</td>
							{schools.map((school) => {
								const rawValue = metric.accessor
									? metric.accessor(school)
									: metric.key
									? school?.[metric.key]
									: undefined;
								const content = metric.render
									? metric.render(rawValue, school)
									: metric.format
									? metric.format(rawValue, school)
									: rawValue ?? "N/A";
								return (
									<td
										key={`${metric.key || metric.label}-${school.unit_id || school.name}`}
										className="px-3 py-2 text-slate-800"
									>
										{content}
									</td>
								);
							})}
						</tr>
					))}
				</tbody>
			</table>
		</div>
	</SectionCard>
);

const CollegeCompare = () => {
	const [searchTerm, setSearchTerm] = useState("");
	const [results, setResults] = useState([]);
	const [selected, setSelected] = useState([]);
	const [comparison, setComparison] = useState({});
	const [loadingSearch, setLoadingSearch] = useState(false);
	const [addingCollege, setAddingCollege] = useState(false);
	const [loadingCompare, setLoadingCompare] = useState(false);
	const [error, setError] = useState("");
	const [infoMessage, setInfoMessage] = useState("");

	const fetchUniversities = async (overrides = {}) => {
		setLoadingSearch(true);
		setError("");
		try {
			const payload = await searchUniversities({
				search: overrides.search ?? searchTerm,
				perPage: 4,
			});
			setResults(payload.data || []);
		} catch (err) {
			console.error(err);
			setError("Unable to load universities right now. Please try again later.");
		} finally {
			setLoadingSearch(false);
		}
	};

	useEffect(() => {
		fetchUniversities({ search: "New Mexico" });
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const handleAdd = (university) => {
		if (selected.find((entry) => entry.unit_id === university.unit_id)) {
			setInfoMessage("This college is already selected for comparison.");
			setTimeout(() => {
				setInfoMessage("");
			}, 2000);
			return;
		}
		if (selected.length >= 3) {
			setInfoMessage("You can compare up to 3 colleges at a time.");
			setTimeout(() => {
				setInfoMessage("");
			}, 2000);
			return;
		}
		setAddingCollege(true);
		setTimeout(() => {
			setAddingCollege(false);
		}, 1000);
		
		setSelected((prev) => [...prev, university]);
	};

	const handleRemove = (unitId) => {
		setSelected((prev) => prev.filter((entry) => entry.unit_id !== unitId));
		setComparison((prev) => {
			const next = { ...prev };
			delete next[unitId];
			return next;
		});
	};

	useEffect(() => {
		if (selected.length === 0) {
			setComparison({});
			return;
		}
		const fetchComparison = async () => {
			setLoadingCompare(true);
			try {
				const detail = await compareUniversitiesByIds(
					selected.map((entry) => entry.unit_id)
				);
				const mapped = detail.reduce((acc, school) => {
					if (school?.unit_id) {
						acc[school.unit_id] = school;
					}
					return acc;
				}, {});
				setComparison(mapped);
			} catch (err) {
				console.error(err);
				setError("Unable to load comparison data.");
			} finally {
				setLoadingCompare(false);
			}
		};
		fetchComparison();
	}, [selected]);

	const comparisonOrder = useMemo(
		() => selected.map((entry) => comparison[entry.unit_id] || entry),
		[selected, comparison]
	);

	const renderSocioEconomic = () => (
		<SectionCard title="Socio-Economic Diversity">
			<div className="overflow-x-auto">
				<table className="min-w-full text-sm">
					<thead>
						<tr className="text-sm uppercase tracking-wide text-slate-600">
							<th className="text-left px-3 py-2 font-bold">Metric</th>
							{comparisonOrder.map((school) => (
								<th key={`socio-${school.unit_id || school.name}`} className="text-left px-3 py-2 font-bold">
									{school.name || "College"}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{socioRows.map((row) => (
							<tr key={row.key} className="border-t border-slate-100">
								<td className="px-3 py-2 font-medium text-slate-700">{row.label}</td>
								{comparisonOrder.map((school) => (
									<td key={`${row.key}-${school.unit_id || school.name}`} className="px-3 py-2 text-slate-800">
										{formatPercent(
											school?.socioeconomic_diversity?.[row.key]
										)}
									</td>
								))}
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</SectionCard>
	);

	const renderRaceTable = () => (
		<SectionCard title="Race/Ethnicity">
			<div className="overflow-x-auto">
				<table className="min-w-full text-sm">
					<thead>
						<tr className="text-sm uppercase tracking-wide text-slate-600">
							<th className="text-left px-3 py-2 font-bold">Group</th>
							{comparisonOrder.map((school) => (
								<th key={`race-${school.unit_id || school.name}`} className="text-left px-3 py-2 font-bold">
									{school.name || "College"}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{raceRows.map((row) => (
							<tr key={row.key} className="border-t border-slate-100">
								<td className="px-3 py-2 font-medium text-slate-700">{row.label}</td>
								{comparisonOrder.map((school) => (
									<td key={`${row.key}-${school.unit_id || school.name}`} className="px-3 py-2 text-slate-800">
										{formatPercent(school?.campus_diversity?.[row.key])}
									</td>
								))}
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</SectionCard>
	);

	const renderFamilyIncome = () => (
		<SectionCard
			title="Average Annual Cost by Family Income"
			note="Displayed net price is whichever (public or private) breakdown is available for each school"
		>
			<div className="overflow-x-auto">
				<table className="min-w-full text-sm">
					<thead>
						<tr className="text-sm uppercase tracking-wide text-slate-600">
							<th className="text-left px-3 py-2 font-bold">Income Bracket</th>
							{comparisonOrder.map((school) => (
								<th key={`income-${school.unit_id || school.name}`} className="text-left px-3 py-2 font-bold">
									{school.name || "College"}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{familyIncomeBrackets.map((bracket) => (
							<tr key={bracket.key} className="border-t border-slate-100">
								<td className="px-3 py-2 font-medium text-slate-700">{bracket.label}</td>
								{comparisonOrder.map((school) => {
									const breakdown = school?.family_income_net_price?.breakdown || {};
									return (
										<td key={`${bracket.key}-${school.unit_id || school.name}`} className="px-3 py-2 text-slate-800">
											{formatCurrency(breakdown[bracket.key])}
										</td>
									);
								})}
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</SectionCard>
	);

	return (
		<section className="space-y-6">
			<header className="space-y-2">
				<h2 className="text-2xl font-semibold text-slate-900">Compare colleges</h2>
				<p className="text-sm text-slate-600">
					Search for universities and add upto three colleges/universities
				</p>
			</header>

			<div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 space-y-4">
				<form
					onSubmit={(event) => {
						event.preventDefault();
						fetchUniversities();
					}}
					className="flex flex-col md:flex-row gap-3"
				>
					<input
						value={searchTerm}
						onChange={(event) => setSearchTerm(event.target.value)}
						className="flex-1 px-4 py-2 rounded-lg border border-slate-200"
						placeholder="Search by college name or city"
					/>
					<button
						type="submit"
						className="px-4 py-2 rounded-lg bg-slate-900 text-white font-medium hover:bg-slate-700"
						disabled={loadingSearch}
					>
						{loadingSearch ? "Searching…" : "Search"}
					</button>
				</form>

				{infoMessage && (
					<div className="text-sm text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-4 py-2">
						{infoMessage}
					</div>
				)}

				{error && (
					<div className="text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-4 py-2">
						{error}
					</div>
				)}

				{addingCollege && (
					<p className="text-sm text-center font-semibold">Adding college to the comparison list...</p>
				)}

				<div className="grid gap-4 md:grid-cols-2">
					{results.map((university) => (
						<article
							key={university.unit_id}
							className="border border-slate-200 pb-8	 rounded-lg p-4 flex flex-col gap-2"
						>
							<div className="flex items-start justify-between gap-2">
								<div>
									<h3 className="text-lg font-semibold text-slate-900">
										{university.name}
									</h3>
									<p className="text-sm text-slate-500">
										{university.city}, {university.state}
									</p>
								</div>
								<button
									type="button"
									onClick={() => handleAdd(university)}
									className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
								>
									Add to compare
								</button>
							</div>
							{/* <ul className="text-xs pt-2 text-slate-600 space-y-1">
								<li>Graduation Rate: {formatPercent(university.graduation_rate)}</li>
								<li>Average Annual Cost: {formatCurrency(university.average_annual_cost)}</li>
								<li>Number of Students: {formatNumber(university.size)}</li>
							</ul> */}
						</article>
					))}
					{results.length === 0 && !loadingSearch && (
						<div className="text-sm text-slate-500">No universities matched that search.</div>
					)}
				</div>
			</div>

			{selected.length > 0 && (
				<div className="space-y-4">
					<div className="flex flex-wrap gap-2">
						{selected.map((entry) => (
							<span
								key={entry.unit_id}
								className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-sm"
							>
								{entry.name}
								<button
									type="button"
									onClick={() => handleRemove(entry.unit_id)}
									className="text-indigo-500 hover:text-indigo-700"
								>
									x
								</button>
							</span>
						))}
					</div>

					{loadingCompare ? (
						<div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 text-sm text-slate-500">
							Loading comparison…
						</div>
					) : (
						<div className="space-y-4">
							<ComparisonTable title="College Overview" metrics={overviewMetrics} schools={comparisonOrder} />
							<ComparisonTable title="Costs & Earnings" metrics={outcomeMetrics} schools={comparisonOrder} />
							<ComparisonTable title="Enrollment Overview" metrics={enrollmentMetrics} schools={comparisonOrder} />
							<ComparisonTable title="Admissions & Student Success" metrics={admissionsMetrics} schools={comparisonOrder} />
							<ComparisonTable title="Financial Aid & Loans" metrics={financialMetrics} schools={comparisonOrder} />
							{/* <ComparisonTable
								title="Student Life & Campus Costs"
								metrics={studentLifeMetrics}
								schools={comparisonOrder}
								note="The College Scorecard API does not report on-campus living expenses. Values show availability only."
							/>
							<ComparisonTable
								title="Program & Course Insights"
								metrics={courseInsightMetrics}
								schools={comparisonOrder}
								note="Use the Education Plan builder to explore specific courses, credit hours, and requirements."
							/> */}
							{/* {renderSocioEconomic()} */}
							{renderRaceTable()}
							{renderFamilyIncome()}
						</div>
					)}
				</div>
			)}
		</section>
	);
};

export default CollegeCompare;
