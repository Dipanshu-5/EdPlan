import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, register } from '../services/authService.js';
import { save as saveStorage } from '../utils/storage.js';
import toast from 'react-hot-toast';

const LoginPage = ({ initialMode = 'login' }) => {
  const [isLogin, setIsLogin] = useState(initialMode !== 'signup');
  const [form, setForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phoneNumber: ''
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    try {
      if (isLogin) {
        const response = await login({
          email: form.email,
          password: form.password
        });
        const { success, data, message } = response.data || {};
        if (success) {
          if (data?.bearer_token) {
            saveStorage('AuthToken', data.bearer_token);
          }
          if (data) {
            saveStorage('UserProfile', data);
          }
          saveStorage('UserEmail', form.email);
          navigate('/eduai');
        } else {
          setError(message || 'Login failed. Please check your credentials.');
        }
        return;
      }

      const payload = {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phoneNumber: form.phoneNumber,
        password: form.password,
        role: 2,
        agreeToTerms: true
      };
      const response = await register(payload);
      const { success, message } = response.data || {};
      if (success) {
        toast.success('Registration successful! You can now login.');
        setIsLogin(true);
      } else {
        setError(message || 'Registration failed.');
      }
    } catch (err) {
      console.error(err);
      const serverMessage =
        err.response?.data?.message || err.response?.data?.detail || err.message;
      setError(serverMessage || 'Something went wrong. Please try again later.');
    }
  };

  return (
    <section className="min-h-screen w-full flex items-center justify-center bg-slate-100">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-xl shadow-lg p-8 space-y-6">
        <header className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold text-slate-900">
            {isLogin ? 'Welcome back' : 'Create your account'}
          </h1>
          <p className="text-sm text-slate-600">
            {isLogin
              ? 'Sign in to continue planning your academic journey.'
              : 'Register to build personalized education plans.'}
          </p>
        </header>

        {error && (
          <div className="bg-rose-50 text-rose-700 border border-rose-100 rounded-lg px-4 py-3 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="text-sm text-slate-600 space-y-1">
                First name
                <input
            name="firstName"
            value={form.firstName}
            onChange={handleChange}
            className="w-full px-3 py-2 rounded-lg border border-slate-200"
          />
        </label>
        <label className="text-sm text-slate-600 space-y-1">
          Last name
          <input
            name="lastName"
            value={form.lastName}
            onChange={handleChange}
            className="w-full px-3 py-2 rounded-lg border border-slate-200"
          />
        </label>
      </div>
          )}

          <label className="text-sm text-slate-600 space-y-1">
            Email
            <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            className="w-full px-3 py-2 rounded-lg border border-slate-200"
            required
          />
        </label>

          {!isLogin && (
          <label className="text-sm text-slate-600 space-y-1">
            Phone number
            <input
              name="phoneNumber"
              value={form.phoneNumber}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-lg border border-slate-200"
            />
          </label>
        )}

          <label className="text-sm text-slate-600 space-y-1">
            Password
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-lg border border-slate-200"
              required
            />
          </label>

          <button
            type="submit"
            className="w-full px-4 py-2.5 rounded-lg bg-slate-900 text-white font-medium hover:bg-slate-700"
          >
            {isLogin ? 'Login' : 'Sign up'}
          </button>
        </form>

        <footer className="text-center text-sm text-slate-500">
          {isLogin ? (
            <>
              Don&apos;t have an account?{' '}
              <button
                type="button"
                onClick={() => setIsLogin(false)}
                className="text-indigo-600 hover:text-indigo-500 font-medium"
              >
                Create one
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => setIsLogin(true)}
                className="text-indigo-600 hover:text-indigo-500 font-medium"
              >
                Sign in
              </button>
            </>
          )}
        </footer>
      </div>
    </section>
  );
};

export default LoginPage;
