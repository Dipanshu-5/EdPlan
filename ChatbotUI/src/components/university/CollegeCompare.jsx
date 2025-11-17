import { useEffect, useMemo, useState } from "react";
import {
	searchUniversities,
	compareUniversitiesByIds,
} from "../../services/universityService.js";

const formatPercent = (value) =>
	value || value === 0 ? `${(value * 100).toFixed(1).replace(/\.0$/, "")}%` : "N/A";
const formatCurrency = (value) =>
	value || value === 0 ? `$${(Number(value) /1000).toFixed(1).toLocaleString()}k` : "N/A";
const formatNumber = (value) =>
	value || value === 0 ? `${Number(value /1000).toFixed(0).toLocaleString()}k
` : "N/A";

const costMetrics = [
	{ key: "average_annual_cost", label: "Average Annual Cost", format: formatCurrency },
	{ key: "graduation_rate", label: "Graduation Rate", format: formatPercent },
	{ key: "median_earnings", label: "Median Earnings (10 yrs)", format: formatCurrency },
	{ key: "full_time_enrollment", label: "Full-time Enrollment", format: formatNumber },
	{ key: "test_score", label: "Average SAT/ACT Score", format: formatNumber },
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
			<h3 className="text-base font-semibold text-slate-800">{title}</h3>
			{note && <p className="text-xs text-slate-500">{note}</p>}
		</div>
		{children}
	</div>
);

const ComparisonTable = ({ title, metrics, schools }) => (
	<SectionCard title={title}>
		<div className="overflow-x-auto">
			<table className="min-w-full text-sm">
				<thead>
					<tr className="text-xs uppercase tracking-wide text-slate-500">
						<th className="text-left px-3 py-2 font-semibold">Metric</th>
						{schools.map((school) => (
							<th key={school.unit_id || school.name} className="text-left px-3 py-2 font-semibold">
								{school.name || "Selected college"}
							</th>
						))}
					</tr>
				</thead>
				<tbody>
					{metrics.map((metric) => (
						<tr key={metric.key} className="border-t border-slate-100">
							<td className="px-3 py-2 font-medium text-slate-700">{metric.label}</td>
							{schools.map((school) => {
								const value = school?.[metric.key];
								const content = metric.format ? metric.format(value) : value ?? "N/A";
								return (
									<td key={`${metric.key}-${school.unit_id || school.name}`} className="px-3 py-2 text-slate-800">
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

	const fetchUniversities = async () => {
		setLoadingSearch(true);
		setError("");
		try {
			const payload = await searchUniversities({
				search: searchTerm,
				perPage: 6,
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
		fetchUniversities();
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
						<tr className="text-xs uppercase tracking-wide text-slate-500">
							<th className="text-left px-3 py-2 font-semibold">Metric</th>
							{comparisonOrder.map((school) => (
								<th key={`socio-${school.unit_id || school.name}`} className="text-left px-3 py-2 font-semibold">
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
						<tr className="text-xs uppercase tracking-wide text-slate-500">
							<th className="text-left px-3 py-2 font-semibold">Group</th>
							{comparisonOrder.map((school) => (
								<th key={`race-${school.unit_id || school.name}`} className="text-left px-3 py-2 font-semibold">
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
						<tr className="text-xs uppercase tracking-wide text-slate-500">
							<th className="text-left px-3 py-2 font-semibold">Income Bracket</th>
							{comparisonOrder.map((school) => (
								<th key={`income-${school.unit_id || school.name}`} className="text-left px-3 py-2 font-semibold">
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

	const renderCollegeInfo = () => (
		<SectionCard title="College Information">
			<div className="overflow-x-auto">
				<table className="min-w-full text-sm">
					<thead>
						<tr className="text-xs uppercase tracking-wide text-slate-500">
							<th className="text-left px-3 py-2 font-semibold">Detail</th>
							{comparisonOrder.map((school) => (
								<th key={`info-${school.unit_id || school.name}`} className="text-left px-3 py-2 font-semibold">
									{school.name || "College"}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						<tr className="border-t border-slate-100">
							<td className="px-3 py-2 font-medium text-slate-700">Location</td>
							{comparisonOrder.map((school) => (
								<td key={`location-${school.unit_id || school.name}`} className="px-3 py-2 text-slate-800">
									{school.college_info?.location || "N/A"}
								</td>
							))}
						</tr>
						<tr className="border-t border-slate-100">
							<td className="px-3 py-2 font-medium text-slate-700">Institution Type</td>
							{comparisonOrder.map((school) => (
								<td key={`type-${school.unit_id || school.name}`} className="px-3 py-2 text-slate-800">
									{school.college_info?.type || "N/A"}
								</td>
							))}
						</tr>
						<tr className="border-t border-slate-100">
							<td className="px-3 py-2 font-medium text-slate-700">Campus Setting</td>
							{comparisonOrder.map((school) => (
								<td key={`setting-${school.unit_id || school.name}`} className="px-3 py-2 text-slate-800">
									{school.college_info?.setting || "N/A"}
								</td>
							))}
						</tr>
						<tr className="border-t border-slate-100">
							<td className="px-3 py-2 font-medium text-slate-700">Website</td>
							{comparisonOrder.map((school) => {
								const website = school.college_info?.website;
								return (
									<td key={`site-${school.unit_id || school.name}`} className="px-3 py-2 text-slate-800">
										{website ? (
											<a
												href={website}
												target="_blank"
												rel="noreferrer"
												className="text-indigo-600 hover:text-indigo-500"
											>
												{website.replace(/^https?:\/\//i, "")}
											</a>
										) : (
											"N/A"
										)}
									</td>
								);
							})}
						</tr>
					</tbody>
				</table>
			</div>
		</SectionCard>
	);

	return (
		<section className="space-y-6">
			<header className="space-y-2">
				<h2 className="text-2xl font-semibold text-slate-900">Compare colleges side by side</h2>
				<p className="text-sm text-slate-600">
					Search for universities and add uplto three colleges/universities for comparison...
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
					<p className="text-sm text-center font-semibold">Adding college to the compare list...</p>
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
							<ComparisonTable title="Cost & Outcomes" metrics={costMetrics} schools={comparisonOrder} />
							{/* <ComparisonTable title="Financial Aid & Loans" metrics={financialMetrics} schools={comparisonOrder} /> */}
							{/* {renderCollegeInfo()} */}
							{/* {renderSocioEconomic()} */}
							{/* {renderRaceTable()} */}
							{/* {renderFamilyIncome()} */}
						</div>
					)}
				</div>
			)}
		</section>
	);
};

export default CollegeCompare;
