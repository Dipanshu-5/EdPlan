import { Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout.jsx";
import HomePage from "./pages/HomePage.jsx";
import EducationPlanEditPage from "./pages/EducationPlanEditPage.jsx";
import ViewEducationPlanPage from "./pages/ViewEducationPlanPage.jsx";
import FindUniversityPage from "./pages/FindUniversityPage.jsx";
import CollegeComparePage from "./pages/CollegeComparePage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import SignupPage from "./pages/SignupPage.jsx";
import IntakeForm from "./pages/IntakeForm.jsx";

const App = () => (
	<Routes>
		<Route element={<AppLayout />}>
			<Route path="/" element={<Navigate to="/home" replace />} />
			<Route path="/home" element={<HomePage />} />
			<Route path="/intake" element={<IntakeForm />} />
			{/* <Route path="/edu" element={<EducationPlanPage />} /> */}
			{/* <Route path="/eduai" element={<LandingPage />} /> */}
			{/* <Route path="/chatbot" element={<ChatbotPage />} /> */}
			{/* <Route path="/programdetails" element={<ProgramDetailsPage />} /> */}
			<Route path="/educationplan" element={<EducationPlanEditPage />} />
			<Route path="/view" element={<ViewEducationPlanPage />} />
			{/* <Route path="/schedule" element={<SchedulePage />} /> */}
			<Route path="/uni" element={<FindUniversityPage />} />
			<Route path="/compare" element={<CollegeComparePage />} />
		</Route>
		<Route path="/login" element={<LoginPage />} />
		<Route path="/signup" element={<SignupPage />} />
		<Route path="*" element={<Navigate to="/home" replace />} />
	</Routes>
);

export default App;
