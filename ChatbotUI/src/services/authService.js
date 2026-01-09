import axios from "axios";
import { load } from "../utils/storage.js";
import { API_BASE_URL } from "./apiBaseUrl.js";

const client = axios.create({
	baseURL: API_BASE_URL,
	headers: {
		"Content-Type": "application/json",
	},
});

client.interceptors.request.use((config) => {
	const token = load("AuthToken");
	if (token) {
		config.headers = config.headers ?? {};
		if (!config.headers.Authorization) {
			config.headers.Authorization = `Bearer ${token}`;
		}
	}
	return config;
});

export const login = ({ email, password }) =>
	client.post("/users/login", {
		email,
		password,
	});

export const register = ({
	firstName,
	lastName,
	email,
	phoneNumber,
	password,
}) =>
	client.post("/users", {
		first_name: firstName,
		last_name: lastName,
		email,
		phone_number: phoneNumber,
		password,
	});

export const requestEmailVerification = (email) =>
	client.post("/users/email-verification/request", { email });

export const getEmailVerificationStatus = (email) =>
	client.get("/users/email-verification/status", { params: { email } });

export const addEducationPlan = ({
	email,
	program,
	rescheduledata,
	reschedule,
	uniqueIdentifier,
}) =>
	client.post("/users/education-plan", {
		emailaddress: email,
		program,
		rescheduledata,
		reschedule,
		uniqueIdentifier,
	});

export const rescheduleCourses = ({ email, reschedule }) =>
	client.post("/users/education-plan/reschedule", {
		emailaddress: email,
		reschedule,
	});

export const getEducationPlan = ({ email, programName, universityName }) =>
	client.post("/users/education-plan/query", {
		email,
		programname: programName,
		univerityname: universityName,
	});

export const getEducationPlanList = (email) => {
	const normalizedEmail = typeof email === "string" ? email : email?.email;
	return client.post("/users/education-plan/list", { email: normalizedEmail });
};

export const deleteEducationPlan = ({ email, programName, universityName }) =>
	client.post("/users/education-plan/delete", {
		email,
		programname: programName,
		univerityname: universityName,
	});

export default client;
