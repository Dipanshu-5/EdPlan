import axios from 'axios';
import { load } from '../utils/storage.js';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

client.interceptors.request.use((config) => {
  const token = load('AuthToken');
  if (token) {
    config.headers = config.headers ?? {};
    if (!config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export const login = ({ email, password }) =>
  client.post('/users/login', {
    EmailAddress: email,
    Password: password
  });

export const register = ({
  firstName,
  lastName,
  email,
  phoneNumber,
  password,
  role = 2,
  agreeToTerms = true
}) =>
  client.post('/users', {
    FirstName: firstName,
    LastName: lastName,
    EmailAddress: email,
    PhoneNumber: phoneNumber,
    Role: role,
    Password: password,
    IsAgreeTermsAndConditions: agreeToTerms
  });

export const addEducationPlan = ({ email, program, rescheduledata, reschedule }) =>
  client.post('/users/education-plan', {
    emailaddress: email,
    program,
    rescheduledata,
    reschedule
  });

export const rescheduleCourses = ({ email, reschedule }) =>
  client.post('/users/education-plan/reschedule', {
    emailaddress: email,
    reschedule
  });

export const getEducationPlan = ({ email, programName, universityName }) =>
  client.post('/users/education-plan/query', {
    email,
    programname: programName,
    univerityname: universityName
  });

export const getEducationPlanList = (email) =>
  client.get(`/users/${encodeURIComponent(email)}/programs`);

export default client;
