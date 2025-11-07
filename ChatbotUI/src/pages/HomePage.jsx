const HomePage = () => (
  <section className="w-full h-full flex flex-col items-center justify-center py-24 px-6 bg-gradient-to-br from-indigo-50 via-white to-purple-50">
    <div className="max-w-3xl text-center space-y-6">
      <img
        src="/assets/logo.jpeg"
        alt="EduPlan.ai"
        className="w-32 h-32 object-contain mx-auto rounded-full shadow-md"
      />
      <h2 className="text-4xl font-bold text-slate-900">Plan your educational path.</h2>
      <p className="text-lg text-slate-600">
        Explore and compare colleges, build personalized education plans, and stay on top of your
        course schedule with the help of EduPlan.ai.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-4">
        <a
          href="/eduai"
          className="px-6 py-3 rounded-lg bg-slate-900 text-white font-semibold shadow hover:bg-slate-700"
        >
          Start now
        </a>
        <a
          href="/login"
          className="px-6 py-3 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:border-slate-500"
        >
          Log in
        </a>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-slate-600">
        <div className="bg-white rounded-lg shadow p-4">
          Help me find the best education plan tailored to my goals.
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          Estimate the total tuition and living expenses by university.
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          Learn how to apply for scholarships and financial aid.
        </div>
      </div>
    </div>
  </section>
);

export default HomePage;
