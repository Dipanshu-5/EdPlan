const normalizeBaseUrl = (value) => {
	if (!value) return "";
	let base = String(value).trim();
	base = base.replace(/\/+$/, "");

	if (
		typeof window !== "undefined" &&
		window.location?.protocol === "https:" &&
		base.startsWith("http://")
	) {
		base = base.replace(/^http:\/\//, "https://");
	}

	return base;
};

export const getApiBaseUrl = () => {
	const fromEnv = import.meta.env?.VITE_API_BASE_URL;
	const origin =
		typeof window !== "undefined" ? window.location.origin : "http://localhost:5173";
	const fallback = import.meta.env?.DEV
		? "http://localhost:8000/api"
		: `${origin}/api`;
	return normalizeBaseUrl(fromEnv || fallback);
};

export const API_BASE_URL = getApiBaseUrl();
