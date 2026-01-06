import { NavLink, useLocation, useNavigate } from "react-router-dom";
import clsx from "clsx";
import { load, remove } from "../../utils/storage.js";

const NavItem = ({ to, label }) => (
	<NavLink
		to={to}
		className={({ isActive }) =>
			clsx(
				"w-full px-4 py-3 font-semibold text-left rounded-md transition",
				isActive
					? "bg-[#016ce6] text-white shadow-lg"
					: "text-slate-600 bg-slate-100 hover:bg-slate-200"
			)
		}
	>
		{label}
	</NavLink>
);

const Navigation = () => {
	const location = useLocation();
	const navigate = useNavigate();
	const isAuthenticated = Boolean(load("AuthToken"));
	const profile = load("UserProfile");
	const firstName =
		typeof profile?.first_name === "string"
			? profile.first_name
			: typeof profile?.firstName === "string"
			? profile.firstName
			: "";
	const lastName =
		typeof profile?.last_name === "string"
			? profile.last_name
			: typeof profile?.lastName === "string"
			? profile.lastName
			: "";
	const fullName = [firstName, lastName].filter(Boolean).join(" ");

	const buttonLabel = isAuthenticated
		? "Logout"
		: location.pathname === "/login"
		? "Sign up"
		: "Login";

	const handleAuthClick = () => {
		if (isAuthenticated) {
			remove("AuthToken");
			remove("UserEmail");
			remove("UserProfile");
			navigate("/login");
			return;
		}
		navigate(location.pathname === "/login" ? "/signup" : "/login");
	};

	return (
		<aside className="w-full lg:w-72 bg-white border-r border-slate-200 shadow-sm p-6 flex flex-col gap-6 lg:fixed lg:h-screen lg:top-0 lg:left-0 lg:overflow-y-auto">
			<header className="flex items-start justify-between gap-4">
				<div>
					<h1 className="ml-4 text-3xl font-semibold text-slate-900">
						EdPlan.ai
					</h1>
				</div>
				<div className="flex flex-col items-end">
					{isAuthenticated && fullName && (
						<span className="text-md font-medium text-slate-600">
							{fullName}
						</span>
					)}
					<button
						type="button"
						onClick={handleAuthClick}
						className="font-medium text-lg text-indigo-600 hover:text-indigo-500"
					>
						{buttonLabel}
					</button>
				</div>
			</header>
			<nav className="flex flex-col gap-2">
				<NavItem to="/home" label="Home" />
				<NavItem to="/career" label="Career & Program" />
				<NavItem to="/intake" label="Onboarding Form" />
				<NavItem to="/uni" label="Find University" />
				{/* <NavItem to="/programdetails" label="Program Details" /> */}
				<NavItem to="/educationplan" label="Create Education Plan" />
				<NavItem to="/view" label="Saved Plans" />
				{/* <NavItem to="/compare" label="Compare Colleges" /> */}
				{/* <NavItem to="/edu" label="Education Plan" />
				<NavItem to="/eduai" label="Workspace" />
				<NavItem to="/schedule" label="Schedule" />
				<NavItem to="/chatbot" label="Chatbot" /> */}
			</nav>
		</aside>
	);
};

export default Navigation;
