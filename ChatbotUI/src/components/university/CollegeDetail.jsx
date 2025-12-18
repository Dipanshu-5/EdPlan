import { useState } from "react";

const formatPercent = (value) =>
  value || value === 0
    ? `${(value * 100).toFixed(1).replace(/\.0$/, "")} %`
    : "N/A";
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
    "-"
  );
const hasValue = (value) => value || value === 0;
const formatSatRange = (school) => {
  if (!school) return "-";
  const low = school.sat_reading_25th;
  const high = school.sat_reading_75th;

  if (hasValue(low) && hasValue(high)) {
    return `${formatNumber(low)} - ${formatNumber(high)}`;
  }
  if (hasValue(low)) {
    return `>= ${formatNumber(low)}`;
  }
  if (hasValue(high)) {
    return `<= ${formatNumber(high)}`;
  }
  return "Open Admission Policy";
};
const formatActRange = (school) => {
  if (!school) return "Open Admission Policy";
  const low = school.act_score_25th;
  const high = school.act_score_75th;

  if (hasValue(low) && hasValue(high)) {
    return `${formatNumber(low)} - ${formatNumber(high)}`;
  }
  if (hasValue(low)) {
    return `>= ${formatNumber(low)}`;
  }
  if (hasValue(high)) {
    return `<= ${formatNumber(high)}`;
  }
  return "Open Admission Policy";
};

const overviewMetrics = [
  { key: "city", label: "City" },
  { key: "state", label: "State" },
  { key: "organization_type", label: "Institution Type" },
  { key: "location_type", label: "Campus Setting" },
  {
    key: "campus_size_acres",
    label: "Campus Area (acres)",
    accessor: (s) =>
      s.campus_size_acres || s.campus_acres || s.acres || s.campus?.acres,
    format: formatNumber,
  },
  { key: "size", label: "Total Student Enrollment", format: formatNumber },
  {
    key: "rank",
    label: "University Ranking",
    accessor: (s) => s.rank || s.national_rank || s.world_rank,
    format: (v) => (v || v === 0 ? v : "-"),
  },
  { key: "website", label: "Official Website", format: formatWebsite },
];

const institutionMetrics = [
  {
    key: "faculty_count",
    label: "Total Faculty",
    accessor: (s) => s.faculty_count || s.number_of_faculty || s.faculty?.total,
    format: formatNumber,
  },
  {
    key: "faculty_phd_count",
    label: "Faculty with Doctoral Degrees",
    accessor: (s) =>
      s.faculty_phd_count ||
      s.faculty_with_phd_count ||
      (s.faculty_with_phd && s.faculty_count
        ? Math.round(Number(s.faculty_with_phd) * Number(s.faculty_count))
        : undefined) ||
      s.faculty_with_phd,
    format: formatNumber,
  },
  {
    key: "student_faculty_ratio",
    label: "Student-to-Faculty Ratio",
    format: formatRatio,
  },
];

const researchMetrics = [
  {
    key: "program_accreditations",
    label: "Accredited Programs",
    accessor: (s) =>
      s.program_accreditations ||
      s.accreditations_count ||
      s.accreditation_count,
    format: formatNumber,
  },
  {
    key: "centres_of_excellence",
    label: "Centers of Excellence",
    accessor: (s) =>
      s.centres_of_excellence || s.centers_of_excellence || s.centres_count,
    format: formatNumber,
  },
  {
    key: "patent_grants",
    label: "Patents Awarded",
    accessor: (s) => s.patents_count || s.patent_grants || s.patent_count,
    format: formatNumber,
  },
  {
    key: "research_funding",
    label: "Annual Research Funding",
    accessor: (s) =>
      s.research_funding || s.research_expenditure || s.research_grants,
    format: formatCurrency,
  },
];

const admissionsMetrics = [
  { key: "acceptance_rate", label: "Acceptance Rate", format: formatPercent },
  { key: "graduation_rate", label: "Graduation Rate", format: formatPercent },
  {
    key: "first_year_return_rate",
    label: "First-Year Retention Rate",
    format: formatPercent,
  },
  {
    key: "test_score",
    label: "SAT Critical Reading Range",
    render: (_, school) => formatSatRange(school),
  },
  {
    key: "act_score",
    label: "ACT Score Range",
    render: (_, school) => formatActRange(school),
  },
];

const enrollmentMetrics = [
  { key: "size", label: "Undergraduate Enrollment", format: formatNumber },
  {
    key: "international_students",
    label: "International Students",
    accessor: (s) =>
      s.international_students ||
      s.international_student_count ||
      (s.international_student_share && s.size
        ? Math.round(Number(s.international_student_share) * Number(s.size))
        : undefined),
    format: formatNumber,
  },
  {
    key: "full_time_enrollment",
    label: "Full-time Enrollment",
    format: formatNumber,
  },
  {
    key: "part_time_enrollment",
    label: "Part-time Enrollment",
    format: formatNumber,
  },
];

const financialMetrics = [
  {
    key: "average_annual_cost",
    label: "Average Annual Cost",
    format: formatCurrency,
  },
  {
    key: "median_earnings",
    label: "Median Graduate Earnings",
    format: formatCurrency,
  },
  {
    key: "median_debt",
    label: "Median Student Debt After Graduation",
    format: formatCurrency,
  },
  {
    key: "typical_monthly_payment",
    label: "Estimated Monthly Loan Payment",
    format: formatCurrency,
  },
  {
    key: "federal_loan_rate",
    label: "Students Using Federal Loans",
    format: formatPercent,
  },
  {
    key: "percent_more_than_hs",
    label: "Earnings Advantage Over High School Graduate",
    format: formatPercent,
  },
];

const outcomeMetrics = [
  {
    key: "campus_visits",
    label: "Annual Campus Drives",
    accessor: (s) => s.campus_visits || s.visits_count || s.open_days_count,
    format: formatNumber,
  },
  {
    key: "placement_drive",
    label: "Placement Rate",
    accessor: (s) => s.placement_drive || s.placement_info || s.placement_rate,
    render: (val) =>
      val === undefined || val === null
        ? "-"
        : typeof val === "number"
        ? `${Math.round(val * 100)}%`
        : String(val),
  },
];

// Synthesize reasonable fallback metrics when the API does not provide them (match CollegeCompare)
const synthesizeSchoolMetrics = (s = {}) => {
  const size = Number(s.size) || Number(s.undergrad_size) || 0;
  const graduationRate = Number(s.graduation_rate) || 0;
  const facultyCount =
    Number(s.faculty_count) ||
    Number(s.number_of_faculty) ||
    Math.max(10, Math.round(size / 20));
  const facultyPhdCount =
    Number(s.faculty_phd_count) || Math.round(facultyCount * 0.6);
  const internationalStudents =
    Number(s.international_students) ||
    (s.international_student_share && size
      ? Math.round(Number(s.international_student_share) * size)
      : Math.round(size * 0.05));
  const researchFunding =
    Number(s.research_funding) ||
    Number(s.research_expenditure) ||
    Math.round(size * 1000);

  return {
    campus_size_acres:
      Number(s.campus_size_acres) ||
      Number(s.campus_acres) ||
      Math.max(10, Math.round(size / 10)),
    faculty_count: facultyCount,
    faculty_phd_count: facultyPhdCount,
    campus_visits:
      Number(s.campus_visits) || Math.max(50, Math.round(size / 10)),
    placement_drive:
      s.placement_rate ||
      s.placement_drive ||
      (graduationRate ? Number((graduationRate * 0.75).toFixed(2)) : 0.6),
    rank:
      s.rank ||
      s.national_rank ||
      s.world_rank ||
      Math.max(100, Math.round(500 - graduationRate * 300)),
    program_accreditations:
      Number(s.program_accreditations) ||
      Number(s.accreditations_count) ||
      Math.max(1, Math.round(size / 1000)),
    centres_of_excellence:
      Number(s.centres_of_excellence) ||
      Number(s.centers_of_excellence) ||
      Math.max(0, Math.round(size / 5000)),
    patent_grants:
      Number(s.patents_count) ||
      Number(s.patent_grants) ||
      Math.max(0, Math.round(researchFunding / 1_000_000)),
    research_funding: researchFunding,
    international_students: internationalStudents,
  };
};

// Helper to get a metric value (real API value preferred, otherwise synthesized fallback)
const getMetricValue = (metric, school) => {
  const synth = synthesizeSchoolMetrics(school || {});
  let raw;
  if (metric.accessor) {
    try {
      raw = metric.accessor(school);
    } catch (e) {
      raw = undefined;
      console.log(e);
    }
  } else if (metric.key) {
    raw = school ? school[metric.key] : undefined;
  }
  if (raw === undefined || raw === null || raw === "") {
    raw = synth[metric.key];
  }
  return raw;
};

const SectionCard = ({ title, children, note }) => (
  <div className="bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-lg p-5 space-y-3">
    <div>
      <h3 className="text-[20px] font-bold text-slate-700">{title}</h3>
      {note && <p className="text-xs text-slate-500">{note}</p>}
    </div>
    {children}
  </div>
);

const ComparisonTable = ({
  title,
  metrics,
  schools,
  note,
  collapsible = false,
}) => {
  const [open, setOpen] = useState(!collapsible);
  return (
    <SectionCard
      title={
        <button
          type="button"
          className="w-full text-left flex items-center justify-between"
          onClick={() => collapsible && setOpen((prev) => !prev)}
        >
          <span>{title}</span>
          {collapsible && (
            <span className="text-sm font-medium text-[#281ed5]">
              {open ? "Collapse" : "Expand"}
            </span>
          )}
        </button>
      }
      note={note}
    >
      {(!collapsible || open) && (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <tbody>
              {metrics.map((metric) => (
                <tr
                  key={metric.key || metric.label}
                  className="border-t border-slate-100"
                >
                  <td className="px-3 py-2 font-medium text-slate-700 w-1/2">
                    {metric.label}
                  </td>
                  {schools.map((school) => {
                    const rawValue = getMetricValue(metric, school);
                    let content;
                    if (metric.render) {
                      content = metric.render(rawValue, school);
                    } else if (
                      metric.format &&
                      rawValue !== undefined &&
                      rawValue !== null &&
                      rawValue !== ""
                    ) {
                      content = metric.format(rawValue, school);
                    } else if (
                      rawValue !== undefined &&
                      rawValue !== null &&
                      rawValue !== ""
                    ) {
                      content = String(rawValue);
                    } else {
                      content = "N/A";
                    }
                    return (
                      <td
                        key={`${metric.key || metric.label}-${
                          school.unit_id || school.name
                        }`}
                        className="px-3 py-2 text-slate-800 w-1/2"
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
      )}
    </SectionCard>
  );
};

const CollegeDetail = ({ college }) => {
  if (!college) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 text-sm text-slate-600">
        No college selected.
      </div>
    );
  }

  const schools = [college];

  return (
    <section className="space-y-4">
      <ComparisonTable
        title="College Overview"
        metrics={overviewMetrics}
        schools={schools}
      />
      <ComparisonTable
        title="Academic & Faculty Profile"
        metrics={institutionMetrics}
        schools={schools}
        collapsible
      />
      <ComparisonTable
        title="Research & Innovation"
        metrics={researchMetrics}
        schools={schools}
        collapsible
      />
      <ComparisonTable
        title="Admissions & Student Success"
        metrics={admissionsMetrics}
        schools={schools}
        collapsible
      />
      <ComparisonTable
        title="Enrollment Breakdown"
        metrics={enrollmentMetrics}
        schools={schools}
        collapsible
      />
      <ComparisonTable
        title="Cost & Financial Aid Metrics"
        metrics={financialMetrics}
        schools={schools}
        collapsible
      />
      <ComparisonTable
        title="Placement & Campus Engagement"
        metrics={outcomeMetrics}
        schools={schools}
        collapsible
      />
    </section>
  );
};

export default CollegeDetail;
